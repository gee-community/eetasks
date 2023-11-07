/*
Handles account selection.
*/
import * as vscode from 'vscode';
import os = require("os");
import path = require("path");
import { exec } from 'child_process';

/*
Returns the credentials if they exist,
otherwise returns undefined. 
*/
export async function getEECredentials(){
 let homedir = os.homedir();
 let credentialsFile = path.join(homedir, ".config", "earthengine", "credentials");
 let cUri = vscode.Uri.file(credentialsFile);
 let credentials:any | undefined;
 try{
   credentials = JSON.parse(
        (await vscode.workspace.fs.readFile(cUri)).toString());
   credentials.grant_type="refresh_token";
 }catch(e){
     credentials = undefined;
 }
 return credentials;
}

/*
Tests whether we can run gcloud.
*/
export async function testGcloud(){
return new Promise((resolve)=>{
    exec("gcloud --version", (err:any) => {  
      if (err) {resolve(false);}
      resolve(true);
    });
});
}

/*
Run command and resolve with result or reject(error).
*/
export async function runCmd(cmd:string){
return new Promise((resolve, reject)=>{
    exec(cmd, (err:any, stdout:string) => {
      if (err) {reject(err);}
      resolve(stdout.trim());
    });
});
}

/*
Gets the list of available gcloud accounts (if any)
*/
export async function getGcloudAccounts(){
  const gcommand = "gcloud auth list --format=\"value(account)\"";
  let accounts: string[] = [];
  try{
    let result = await runCmd(gcommand);
    if (typeof result ==="string"){
        accounts = result.split(os.EOL);
      if(accounts.length>0){
        return accounts;
      }
      return undefined;       
    }
  }catch(e){
    return undefined;
  }
}

export async function updateAccounts(context: vscode.ExtensionContext){
    const eeCredentials = await getEECredentials(); 
    const canRunGcloud = await testGcloud(); 
    let accounts: any = {}; // accountName:token|null

    if ((! canRunGcloud) && (! eeCredentials)){
        vscode.window.showErrorMessage("EE credentials not found, and gcloud is not available.");
        return undefined;
    }

    if(eeCredentials){
        accounts["earthengine"] = null; 
    }

    if(canRunGcloud){
        const gcloudAccounts= await getGcloudAccounts();
        if (gcloudAccounts){
            accounts["application-default"] = null;
            gcloudAccounts.forEach((x)=>{
                accounts[x] = null;
            });
        }
    }
    context.globalState.update("userAccounts", accounts);
    vscode.window.showInformationMessage("Updated user accounts."); 
    return accounts;
}

/*
Picks an account and prompts for project*

If there is only one account available, then there is no need to pick. 

*project not needed if account picked is "earthengine"
Project may also be provided, in which case only the account
is picked.

Finally, calls the callback function using the picked account, project
and extra arguments
*/
export async function pickAccount(project: string | null, context: vscode.ExtensionContext, callback:any, ...args: any[] | undefined[]){
    let accounts:any = context.globalState.get("userAccounts");
    if(!accounts){
        vscode.window.showInformationMessage("Looking for available accounts."); 
        accounts = await updateAccounts(context);
        if(!accounts){return;}
    }
    
    let nAccounts = Object.entries(accounts).length;
    if(nAccounts===1){
        // Only one account, so there is no need to pick
        promptProject(Object.keys(accounts)[0], callback, project, ...args);
        return;
    }

    // Quickpick values (account + project)
    vscode.window.showQuickPick(Object.keys(accounts), 
        {title: "Select account to use."}
    )
    .then(function(account){
      if(account){
        promptProject(account, project, callback, ...args);
      }
    });
    return;
}

export function promptProject(account:string, project:string | null, callback: any, ...args:any[] | undefined[]){
    // If "earthengine", project is not required, so it is set to null
    if(account==="earthengine"){
      // No need to pick a project if using stored credentials
      callback(account, null, ...args);
      return;
    }else{
        if(project){
            callback(account, project.trim(), ...args);
            return;
        }else{

        vscode.window.showInputBox({
            title: "Select a project to use.", 
            prompt: "Example: earthengine-legacy"
        })  
        .then(function(project){
            if(project){
              callback(account, project.trim(), ...args);
            }
        });
        }
    }
}