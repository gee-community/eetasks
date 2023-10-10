// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EETasksPanel } from "./panels/EETasksPanel";
import fs = require("fs");
import os = require("os");
import cp = require("child_process"); 
import path = require("path");

function isStringArray(value: unknown): value is string[]{
    //https://stackoverflow.com/questions/49813443/type-guards-for-types-of-arrays
    if (!Array.isArray(value)){
        return false;
    }
    if (value.some((v)=> typeof v !=="string")){
        return false;
    }
    return true; 
}

function _lookForCachedGcloudAccounts(context: vscode.ExtensionContext){
    let result: string[] = []; 
    let cachedGcloudAccounts = context.globalState.get("gcloudAccounts");
    console.log("Cached gcloud accounts: " + cachedGcloudAccounts); 
    if(cachedGcloudAccounts && isStringArray(cachedGcloudAccounts)){
    cachedGcloudAccounts.forEach((element:string)=>result.push(element)); 
    }
    return result; 
}


function _getGcloudAccounts(context: vscode.ExtensionContext){
    vscode.window.showInformationMessage("Looking for gcloud accounts.");
      let result = cp.spawnSync("gcloud auth list --format=\"value(account)\"", {shell:true});
      let acc: string[] = [];
      if (result.status===0){
        let gacc = result.stdout.toString().split(os.EOL); 
        gacc.forEach((element:string)=>{
            if (element.length>0){
                acc.push(element);
            }
        });
        context.globalState.update("gcloudAccounts", acc);
        vscode.window.showInformationMessage("Updated gcloud accounts cache."); 
      }else{
        vscode.window.showErrorMessage("No gcloud accounts found. \n "
        + " gcloud error message: " + result.stderr);
      }
      return acc; 
  }

 function _which(cli:string){
    let command; 
    if(os.platform()==="win32"){
        command = "where " + cli;
        // Assuming cmd.exe by default.. caveat:
        // https://nodejs.org/api/child_process.html#default-windows-shell
    }else{
        command = "which " + cli;
    }
    let result = cp.spawnSync(command, {shell:true});
    console.log("result: " + result);
    return !result.status;
 }

 function _eeCredentialsExist(){
      const homedir = os.homedir();
      const credentialsFile = path.join(homedir, ".config", "earthengine", "credentials");
      if (fs.existsSync(credentialsFile)){
        return true;
      }else{
        return false;
      }
 }


function promptProject(context: vscode.ExtensionContext, account:string){
    // If "earthengine", project is not required.
    if(account==="earthengine"){
      EETasksPanel.render(context.extensionUri, context.globalState, account.trim(), "");           
    }else{
        vscode.window.showInputBox({
            title: "Select a project to use.", 
            prompt: "Example: earthengine-legacy"
        })  
        .then(function(project){
            if(project){
            EETasksPanel.render(context.extensionUri, context.globalState, account.trim(), project.trim());
            }
        });
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  
  const updateGcloudAccountsList = vscode.commands.registerCommand("eetasks.updateGcloudAccountsList", ()=>{
    let _hasGcloud = _which("gcloud");
    if(!_hasGcloud){
        vscode.window.showErrorMessage("Gcloud not detected. Cannot update gcloud accounts list.");
        return;
    }
    _getGcloudAccounts(context);
  });

  const openTasksViaPrivateKey = vscode.commands.registerCommand("eetasks.openViaPrivateKey", ()=>{
    // Prompt user for private key (should be json file)
    vscode.window.showOpenDialog({
    filters:{"json": ['json', 'JSON']}
    }).then((fileUri)=>{
        if(fileUri){
          // Read the JSON file
          var fs = require("fs");
          let credentials = JSON.parse(fs.readFileSync(fileUri[0].path, "utf8").toString());
          // Validation: should have at least:  
          if (credentials.hasOwnProperty("client_id") &&
              credentials.hasOwnProperty("project_id") &&
              credentials.hasOwnProperty("private_key")){

              // Open task panel with private key.  
              EETasksPanel.render(context.extensionUri, context.globalState, 
              "service-account", 
              credentials.project_id,
              credentials);

          }else{
            vscode.window.showErrorMessage("The file selected is not a valid service account private key.");
          }
       }
    });
  });

  const openDefault = vscode.commands.registerCommand("eetasks.openDefault", ()=>{
    // Get the default values. 
    let conf = vscode.workspace.getConfiguration("eetasks");
    let defaultProject = conf.defaultProject;
    let defaultAccount = conf.defaultAccount;
    let _hasEECred = _eeCredentialsExist();
    let _hasGcloud = _which("gcloud");  

    // If none are set, then just do the eetasks.open command:
    if(!defaultAccount && !defaultProject){
        openMain(); 
        return;
    }
    
    if(defaultAccount==="earthengine"){
        if (! _hasEECred){
            vscode.window.showErrorMessage("EE credentials not found"
            +" (~/.config/earthengine/credentials)."
            + "Cannot use the Earth Engine Task Manager extension with defaultAccount"
            + " set to \"earthengine\"");
            return;           
        } 
    }else{
        if (! _hasGcloud){
            vscode.window.showErrorMessage("Gcloud not found. "
            + "Cannot use the Earth Engine Task Manager extension with defaultAccount"
            + " set to a user account. Try with account set to \"earthengine\"");
            return;           
        }
    }

    if(defaultAccount && defaultProject){
       EETasksPanel.render(context.extensionUri, context.globalState, defaultAccount.trim(), defaultProject.trim());
       return;
    }else{
        // Either one of them is missing, prompt for the other one:
        if(defaultAccount){
            // Prompt for project, then call.
            promptProject(context, defaultAccount);
            return;
        } 

        if(defaultProject){
            // Prompt for account, then call.

            let defaultAccounts = availableAccounts(_hasEECred, _hasGcloud);
            // If just one account found, there is no need for quickpick. 
            if(defaultAccounts.length===1){
            EETasksPanel.render(context.extensionUri, context.globalState, defaultAccounts[0], defaultProject.trim());
            return;
            }

            if(defaultAccounts.length<1){
                 vscode.window.showErrorMessage("No accounts found for gcloud. Use gcloud to login and then "
                 + "use the \"EE tasks: update gcloud accounts list\" command.");
                 return;
            }

            // Quickpick values (account only)
            vscode.window.showQuickPick(defaultAccounts, 
                {title: "Select account to use."}
            )
            .then(function(account){
              if(account){
              EETasksPanel.render(context.extensionUri, context.globalState, account, defaultProject.trim());
              }
            });
        }
        }
    }
);

  function availableAccounts(_hasEECred: boolean, _hasGcloud:boolean){
    let gcloudAccounts: string[] = []; // Might be empty (length === 0 )
    if (_hasGcloud){
        // Are there any gcloud accounts stored in the extension's cache?
        // User may update the list manually using the 
        // eetasks.updateGcloudAccountsList command. 
        let cachedGcloudAccounts = _lookForCachedGcloudAccounts(context); 

        if(!isStringArray(cachedGcloudAccounts)){
            gcloudAccounts = _getGcloudAccounts(context); 
        }else{
            gcloudAccounts = cachedGcloudAccounts; 
        }
    }

    let defaultAccounts:string[] = [];

    if(_hasEECred){
        defaultAccounts = defaultAccounts.concat(["earthengine"]); 
    }

    if(gcloudAccounts.length>0){
        defaultAccounts = defaultAccounts.concat(gcloudAccounts); 
    }

    return defaultAccounts;


  }

  function openMain(){
    // Do we have gcloud (optional)?
    let _hasGcloud = _which("gcloud");  
    // Do we have access to ~/.config/earthengine/credentials? (optional..)
    let _hasEECred = _eeCredentialsExist(); // 
    // At least one of them must be true to use the extension. 
    if (!_hasEECred && !_hasGcloud){
        vscode.window.showErrorMessage("EE credentials not found"
        +" (~/.config/earthengine/credentials) and gcloud was not detected. "
        + "Cannot use the Earth Engine Task Manager extension.");
        return;
    }

    let defaultAccounts = availableAccounts(_hasEECred, _hasGcloud);

    // If just one account found, there is no need for quickpick. 
    if(defaultAccounts.length===1){
       promptProject(context,defaultAccounts[0]); 
       return;
    }
    if(defaultAccounts.length<1){
         vscode.window.showErrorMessage("No accounts found for gcloud. Use gcloud to login and then "
         + "use the \"EE tasks: update gcloud accounts list\" command.");
         return;
    }

    // Quickpick values (account + project)
    vscode.window.showQuickPick(defaultAccounts, 
        {title: "Select account to use."}
    )
    .then(function(account){
      if(account){
        promptProject(context, account);
      }
    });
  }

  const openTasksTabCommand = vscode.commands.registerCommand("eetasks.open",openMain);
  context.subscriptions.push(openTasksTabCommand);
  context.subscriptions.push(openDefault);
  context.subscriptions.push(openTasksViaPrivateKey);
  context.subscriptions.push(updateGcloudAccountsList); 
}

// This method is called when your extension is deactivated
export function deactivate() {}
/*
Command view uses the default account and project (if required). 
    If the default account is empty, prompt the user for it.
        TODO
    If the default project is empty (and required), prompt the user for it. 
        TODO
Command view (prompt) prompts user for user account (loads from gcloud auth list) and for project. 
    TODO
Command view (service account) promps the user for a JSON file and authenticates using the service account.
    TODO
*/
// Get gcloud accounts for prompting.





// Create webview panel with the name "EE Tasks: account"
   // where account is "earthengine", "application-default" or a user account. 
    //let account = "earthengine"; // Default
    //let conf = vscode.workspace.getConfiguration("eetasks");     
    //if (conf.authenticationMethod.trim()==="gcloud"){
    //    account = conf.gcloudAccount;
    //}
    //const panelName = "EE Tasks: " + account;

    // If gcloud and account is empty, prompt user for account right away
    // If gcloudAccount is empty, 
    // promp the user to select one.
    //if(this._userOpts.gcloudAccount.trim()===""){
    //    let accountsList = this._getGcloudAccounts(); 
    //    // If empty, abort initialization. 

    //    // Can I treat it as a list?
    //    //accountsList.forEach((element: any) => {
    //    //});
    //    // ^^ prompt user with this list. 
    //    // TODO prompt user here!
    //    // then use it.. 
    //}
    // Initial user options and ee Initialization:

    // Only one webview per userOpts, so we will only read configuration once. 