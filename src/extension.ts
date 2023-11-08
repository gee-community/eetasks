// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EETasksPanel } from "./panels/EETasksPanel";
import { updateAccounts, promptProject, 
    pickAccount, pickServiceAccount } from './utilities/accountPicker';
import { scriptRunnerAsAccount,scriptRunnerAsServiceAccount } from './utilities/scriptRunners';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const updateAccountsCommand = vscode.commands.registerCommand("eetasks.updateGcloudAccountsList",()=>{
        vscode.window.showInformationMessage("Looking for available accounts."); 
        updateAccounts(context);
    }); 
  const openTasksViaPrivateKey = vscode.commands.registerCommand("eetasks.openViaPrivateKey", ()=>{
    pickServiceAccount()
    .then((credentials:any|undefined)=>{
        if(credentials){
        EETasksPanel.render(
         "service-account", 
         credentials.project_id,
         context,
         credentials);
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

  const runScriptCommand = vscode.commands.registerCommand('eetasks.run', ()=>{
    pickAccount(null, context, scriptRunnerAsAccount, context);
  });

  const runScriptAsServiceAccountCommand = vscode.commands.registerCommand(
    'eetasks.runAsServiceAccount', async()=>{
    pickServiceAccount()
    .then((credentials:any|undefined)=>{
        if(credentials){
        scriptRunnerAsServiceAccount(credentials, context);
        }
    });
  });

  context.subscriptions.push(openTasksTabCommand);
  context.subscriptions.push(openDefault);
  context.subscriptions.push(openTasksViaPrivateKey);
  context.subscriptions.push(updateAccountsCommand); 
  context.subscriptions.push(runScriptCommand);
  context.subscriptions.push(runScriptAsServiceAccountCommand);

}

// This method is called when your extension is deactivated
export function deactivate() {}