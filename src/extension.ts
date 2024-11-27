// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EETasksPanel } from "./panels/EETasksPanel";
import { updateAccounts, pickDefaultAccount,
    pickAccount, pickServiceAccount } from './utilities/accountPicker';
import { scriptRunnerAsAccount,scriptRunnerAsServiceAccount } from './utilities/scriptRunners';
import { signin, signout } from './utilities/authenticate';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let scriptLog = vscode.window.createOutputChannel("EE Tasks: GEE script runs");
  const singInCommand = vscode.commands.registerCommand("eetasks.signin",()=>{
        signin(context);
    }); 
  const singOutCommand = vscode.commands.registerCommand("eetasks.signout",()=>{
        signout(context);
    }); 
  const setDefaultcommand = vscode.commands.registerCommand("eetasks.setDefault",()=>{
    pickDefaultAccount(context);
  });

  const updateAccountsCommand = vscode.commands.registerCommand("eetasks.updateUserAccounts",()=>{
        vscode.window.showInformationMessage("Looking for available accounts."); 
        updateAccounts(context);
    }); 
  const openTasksViaPrivateKey = vscode.commands.registerCommand("eetasks.openViaPrivateKey", ()=>{
    pickServiceAccount()
    .then((credentials:any|undefined)=>{
        if(credentials){
        EETasksPanel.render({name:"service-account",kind:"service-account"},
         credentials.project_id,
         context,
         credentials);
        }
    });
  });

  /*
  If there is a default account/project, use it
  If not, run the select default account command to set a default one
  and then open the tasks panel
  */
  const openDefault = vscode.commands.registerCommand("eetasks.openDefault", ()=>{
    let defaultAccount:any = context.globalState.get("defaultAccount");
    let defaultProject:any = context.globalState.get("defaultProject");
    if(defaultAccount){
        EETasksPanel.render(defaultAccount, defaultProject, context);
    }else{
        vscode.window.showInformationMessage(
            "No default account set yet. Select an account to set as default."
        );
        pickDefaultAccount(context, EETasksPanel.render, context);
    }
    });

  const openTasksTabCommand = vscode.commands.registerCommand("eetasks.open",()=>{
    pickAccount(null, context, EETasksPanel.render, context);
  });

  const runScriptCommand = vscode.commands.registerCommand('eetasks.run', ()=>{
    pickAccount(null, context, scriptRunnerAsAccount, context, scriptLog);
  });

  const runScriptAsServiceAccountCommand = vscode.commands.registerCommand(
    'eetasks.runAsServiceAccount', async()=>{
    pickServiceAccount()
    .then((credentials:any|undefined)=>{
        if(credentials){
        scriptRunnerAsServiceAccount(credentials, scriptLog, context);
        }
    });
  });

  context.subscriptions.push(openTasksTabCommand);
  context.subscriptions.push(openDefault);
  context.subscriptions.push(openTasksViaPrivateKey);
  context.subscriptions.push(updateAccountsCommand); 
  context.subscriptions.push(runScriptCommand);
  context.subscriptions.push(runScriptAsServiceAccountCommand);
  context.subscriptions.push(singInCommand);
  context.subscriptions.push(singOutCommand);
  context.subscriptions.push(setDefaultcommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}