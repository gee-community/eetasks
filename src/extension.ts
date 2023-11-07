// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EETasksPanel } from "./panels/EETasksPanel";
import { updateAccounts, pickAccount, promptProject } from './utilities/accountPicker';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const updateAccountsCommand = vscode.commands.registerCommand("eetasks.updateGcloudAccountsList",()=>{
        vscode.window.showInformationMessage("Looking for available accounts."); 
        updateAccounts(context);
    }); 

  const openTasksViaPrivateKey = vscode.commands.registerCommand("eetasks.openViaPrivateKey", ()=>{
    // Prompt user for private key (should be json file)
    vscode.window.showOpenDialog({
    filters:{"json": ['json', 'JSON']}
    }).then((fileUri)=>{
        if(fileUri){
          // Read the JSON file
          var fs = require("fs");
          let credentials = JSON.parse(fs.readFileSync(fileUri[0].fsPath, "utf8").toString());
          // Validation: should have at least:  
          if (credentials.hasOwnProperty("client_id") &&
              credentials.hasOwnProperty("project_id") &&
              credentials.hasOwnProperty("private_key")){

              // Open task panel with private key.  
              EETasksPanel.render(
              "service-account", 
              credentials.project_id,
              context,
              credentials);

          }else{
            vscode.window.showErrorMessage("The file selected is not a valid service account private key.");
          }
       }
    });
  });

  const openDefault = vscode.commands.registerCommand("eetasks.openDefault", ()=>{
    let conf = vscode.workspace.getConfiguration("eetasks");
    let defaultProject = conf.defaultProject;
    let defaultAccount = conf.defaultAccount;
    if (! defaultProject){ defaultProject = null;}
    if (defaultAccount){
       // prompProject handles whether to prompt or not the project
       // e.g. not needed if account is "earthengine", or if
       // already set.
       promptProject(defaultAccount.trim(), defaultProject, EETasksPanel.render, context);
    }else{
      pickAccount(defaultProject, context, EETasksPanel.render, context);
    }
    return;
    }
);

  const openTasksTabCommand = vscode.commands.registerCommand("eetasks.open",()=>{
    pickAccount(null, context, EETasksPanel.render, context);
  });


  context.subscriptions.push(openTasksTabCommand);
  context.subscriptions.push(openDefault);
  context.subscriptions.push(openTasksViaPrivateKey);
  context.subscriptions.push(updateAccountsCommand); 
}

// This method is called when your extension is deactivated
export function deactivate() {}