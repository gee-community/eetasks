/*
Handles account selection.
*/
import * as vscode from 'vscode';
import os = require("os");
import path = require("path");
import { exec } from 'child_process';
import { signin } from './authenticate';

/*
Returns the ~/.config/earthengine/credentials file*
and returns the credentials if they exist,
otherwise returns undefined. 
*This file is stored and managed by the python 
earthengine API. This extension will not modify it. 
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

/*
Interface for storing accounts 
and short-lived tokens
*/
export interface IAccounts{
    [name:string]:IAccount
}
export interface IAccount{
    kind:string,
    token: string | null
}
export interface IPickedAccount{
    name:string,
    kind:string
}
/*
update non sign-in available accounts, i.e.
from the python earthengine-api (persistent credentials)
or from gcloud*

* sign-in accounts of the same name are prioritized,
so the gcloud account of the same name is ignored. 
*/
export async function updateAccounts(context: vscode.ExtensionContext){
    const eeCredentials = await getEECredentials(); 
    const canRunGcloud = await testGcloud(); 
    let userAccounts:IAccounts = {};
    let acc:IAccount;
    let accounts:any = context.globalState.get("userAccounts");
    if (accounts){
        // Only keep signed-in accounts:
        Object.keys(accounts).forEach((k)=>{
            acc = accounts[k];
            if(acc.kind==="Signed in"){
                userAccounts[k] = acc;
            }
        });
    }else{
        userAccounts = {};
    }

    // up to here, userAccounts is either {}
    // or contains ONLY the signed in accounts.
    if ((! canRunGcloud) && (! eeCredentials)){
        vscode.window.showInformationMessage(
            "No available accounts found. "+
            "Use the EE Tasks: signin command to "+
            "sign in.");
        context.globalState.update("userAccounts", userAccounts);
        return userAccounts;
    }

    if(eeCredentials){
        userAccounts["earthengine"]={
            kind: "python earthengine-api credentials",
            token: null
        };
    }

    if(canRunGcloud){
        const gcloudAccounts= await getGcloudAccounts();
        if (gcloudAccounts){
            userAccounts["application-default"]={
                kind: "gcloud",
                token: null
            };           
            gcloudAccounts.forEach((x)=>{
            if(!userAccounts[x]){
                userAccounts[x]={
                    kind: "gcloud",
                    token: null
                }; 
            }          
            });
        }
    }
    context.globalState.update("userAccounts", userAccounts);
    vscode.window.showInformationMessage("Updated accounts."); 
    return userAccounts;
}


/*
Picks an account to set as default
and calls a callback function if defined
*/
export async function pickDefaultAccount(context: vscode.ExtensionContext,
callback?: Function, ...args:any[] | undefined[]){
    pickAccount(
        null,
        context,
        (account:IPickedAccount,project:string|null)=>{
         context.globalState.update("defaultAccount", account);
         context.globalState.update("defaultProject", project);
          let message = `${account.name} set as default account`;
          if(project){
            message+=` with project ${project}`;
          }
          vscode.window.showInformationMessage(message);
          if(callback){
            callback(account, project, ...args);
          }
        }
    );
}

/*
Picks a signed-in account (if any)
to sign out. 
*/
export async function pickSignedInAccount(
    context: vscode.ExtensionContext){
    let uAccounts:any = context.globalState.get("userAccounts");
    let userAccounts:IAccounts = {};
    let nAccounts = 0;
    let accKind:string;
    let accountItems:vscode.QuickPickItem[] = [];

    if(uAccounts){
        userAccounts = uAccounts;
        nAccounts = Object.keys(userAccounts).length;
    }
    if(nAccounts>0){
         let k: keyof typeof userAccounts;
        for (k in userAccounts){       
            if(typeof userAccounts[k] !== "string"){ // Backwards comp.
            accKind=userAccounts[k].kind;
            if(accKind==="Signed in"){
                accountItems.push({label:k});
            }
            }
        }
        nAccounts=accountItems.length;
    }
    if(nAccounts===1){
      return accountItems[0].label;
    }
    if(nAccounts>0){
        let acc = await vscode.window.showQuickPick(accountItems, 
          {title: "Select account to sign out."});
        return acc?.label;
    }else{
        return undefined;
    }
}

/*
Picks an account and prompts for project*

If there is only one account available, then there is no need to pick. 

*project not needed if account picked is "earthengine"
Project may also be provided, in which case only the account
is picked.

Finally, calls the callback function using the picked account, account store, project
and extra arguments
*/
export async function pickAccount(project: string | null, context: vscode.ExtensionContext, callback:Function, ...args: any[] | undefined[]){
    let codicon:string=""; // https://code.visualstudio.com/api/references/icons-in-labels
    let nAccounts = 0;
    let userAccounts:IAccounts = {};
    let accKind:string;
    let uAccounts:any = context.globalState.get("userAccounts");
    let accounts:any = [];
    let accountItems:vscode.QuickPickItem[] = [];
    let accountKinds:string[] = [];

    if(uAccounts){
        userAccounts = uAccounts;
        nAccounts = Object.keys(userAccounts).length;
    }

    // Backwards compatibility patch:
    // In previous versions, userAccounts were simply account(string):token(string)
    // key:value pairs. If we detect this, the accounts need to be updated.
    if(nAccounts>0){
        let accKeys = Object.keys(userAccounts);
        let sampleAccount = userAccounts[accKeys[0]];
        if(typeof sampleAccount === "string"){
           nAccounts=0;  
        }
    }

    // If there are no user accounts yet,
    // try first to update available accounts (non sign-in)
    // if there are still no accounts, prompt the user to
    // sign-in.
    if(nAccounts===0){
        vscode.window.showInformationMessage("Looking for available accounts."); 
        userAccounts = await updateAccounts(context);
        nAccounts=Object.keys(userAccounts).length;
        if(nAccounts===0){
            try{
            userAccounts = await signin(context);
            if(userAccounts){
                nAccounts = Object.keys(userAccounts).length;
                if(nAccounts===0){
                    throw new Error();
                }
            }
            }catch(e:any){
                vscode.window.showErrorMessage(
                "Could not find any account to select.");
                return;
            }
        }  
    }

    // Generate the list of accounts to pick from
    // with a codicon as a prefix to identify the account kind
    if(nAccounts>0){
        let k: keyof typeof userAccounts;
        for (k in userAccounts){
            accKind=userAccounts[k].kind;
            switch(accKind){
                case "python earthengine-api credentials":
                    codicon='$(snake) ';
                    break;
                case "gcloud":
                    codicon='$(terminal-view-icon) ';
                    break;
                case "Signed in":
                    codicon='$(account) ';
                    break;
            }
            accountItems.push({label:codicon+k});
            accountKinds.push(accKind);
            accounts.push({label:codicon+k, kind:accKind});
        }
    }

    let uniqueAccountKinds = [...new Set(accountKinds)];   

    if(nAccounts===1){
        // Only one account, so there is no need to pick
        promptProject(
        {   name:accountItems[0].label.split(" ")[1],
            kind:accountKinds[0]
        }, 
        project, callback, ...args);
        return;
    }

    // Generate the items to show in the quickpick
    // including the separators if needed.
    if (uniqueAccountKinds.length>1){
       accountItems = [];
       uniqueAccountKinds.forEach((kind)=>{
         accountItems.push({
            label:kind,
            kind: vscode.QuickPickItemKind.Separator
         });
        accounts.forEach((acc:{label:string, kind:string})=>{
            if(acc.kind===kind){
                accountItems.push({label:acc.label});
            }
         });
       });
    }
    
    // Quickpick values (account + project)
    vscode.window.showQuickPick(accountItems, 
        {title: "Select account to use."}
    )
    .then(function(item){
        if(item){
        const label = item.label.split(" ");
        const kind = label[0];
        switch(kind){
            case '$(snake)':
                accKind="python earthengine-api credentials";
                break;
            case '$(terminal-view-icon)':
                accKind="gcloud";
                break;
            case '$(account)':
                accKind="Signed in";
                break;
        }
        const account:IPickedAccount = {name: label[1], kind:accKind};
        promptProject(account, project, callback, ...args);
        }
    });
    return;
}

export function promptProject(account:IPickedAccount, project:string | null, callback: Function, ...args:any[] | undefined[]){
    if(project){
        callback(account, project.trim(), ...args);
        return;
    }else{

    vscode.window.showInputBox({
        title: "Type the name of the project to use.", 
        value: "earthengine-legacy",
        prompt: "Example: earthengine-legacy"
    })  
    .then(function(project){
        if(project){
          callback(account, project.trim(), ...args);
        }
    });
    }
}

/*
Prompts the user to pick a service account file (JSON)
reads it, validates it, and finally resolves 
to the credentials, or undefined.
*/
export async function pickServiceAccount(){
 let credentials:any | undefined;
 return new Promise((resolve)=>{
  vscode.window.showOpenDialog({
  filters:{"json": ['json', 'JSON']}
  }).then(async (fileUri)=>{
    if(fileUri){
      try{
        credentials = JSON.parse(
             (await vscode.workspace.fs.readFile(fileUri[0])).toString());
        if (credentials.hasOwnProperty("client_id") &&
               credentials.hasOwnProperty("project_id") &&
               credentials.hasOwnProperty("private_key")){
               resolve(credentials);
         }else{
         vscode.window.showErrorMessage("The file selected is not a valid service account private key.");
         resolve(undefined);
         }
      }catch(e){
         vscode.window.showErrorMessage("Error reading file. \n" + e);
         resolve(undefined);
      }
    }
  });
 });
}   