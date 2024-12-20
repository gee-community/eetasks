/*
Helpers to run GEE scripts from within vscode. 

The user script is wrapped into a function, with additional
"code Editor"-like utilities, as well as the initialized ee library.
*(see codeEditorUtils.js):
- print: mirrors the functionality of print in the Code Editor. 
- Export: mirrors the structure of Export in the Code Editor, with functions
    named identically as in the code Editor, internally wrapping them from
    ee.batch.Export. 
    ⚠️ In contrast to the code Editor, tasks
    are automatically started with a successCallback/errorCallback. 
    This is an added feature of the extension. 
    ⚠️ Another contrast is that the code Editor defines some default values
    for parameters such as description, fileNamePrefix, assetId, etc. Some of 
    could be implemented here (See 🔲 TODO's below), but not all. Therefore
    submission of tasks without these defaults will raise the errorCallback.  
- Map: currently only .setCenter() and .addLayer() have been implemented.
- ui, and Chart: mock objects with a structure such that they will be ignored
    if encountered in the user code. 
*/
import * as vscode from 'vscode';
import { IPickedAccount } from './accountPicker';
import { getAccountToken } from './getToken';
import { Map } from '../panels/Map';

var ee = require("@google/earthengine"); 
var codeEditorUtils = require("./codeEditorUtils.js");

function wrapOnTaskStart(log: vscode.OutputChannel){
  return function onTaskStart(){
        log.appendLine("Successfully submitted task");
        vscode.window.showInformationMessage("Successfully submitted task");
    };
}

function wrapOnTaskStartError(log: vscode.OutputChannel){
  return function onTaskStartError(err:any){
       log.appendLine("Failed to start EE task: \n " + err);
       vscode.window.showErrorMessage("Failed to start EE task: \n " + err);
   };
}

function scriptRunError(err:any){
    vscode.window.showErrorMessage("EE script run failed: \n " + err);
}

function eeInitError(err:any){
    vscode.window.showErrorMessage("EE initialization failed: \n " + err);
}

function scriptRunner(project:string | null, document:vscode.TextDocument, log:vscode.OutputChannel, extensionUri:vscode.Uri){
  let onTaskStart = wrapOnTaskStart(log);
  let onTaskStartError = wrapOnTaskStartError(log);
  try{
    ee.initialize(null, null, 
    async ()=>{
        try {
            const tools = new codeEditorUtils.Tools(ee, log, extensionUri,
                onTaskStart, onTaskStartError,
                document.fileName
            ); 
            const code = `
                export const runUserCode = (tools) => {
                    let ee = tools.ee;
                    let require = tools.Require();
                    let print = tools.print;
                    let Map = tools.Map;
                    let Export = tools.Export;
                    let ui = tools.ui;
                    let Chart = tools.Chart;

                    ${document.getText()}
                };
            `;
            const blob = `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;
            const module = await import(blob);

            log.appendLine("Starting GEE script run: ");
            log.appendLine(document.fileName);
            log.appendLine("----------------------------------");
            module.runUserCode(tools);
            log.appendLine("----------------------------------");
            log.appendLine(`GEE script run ended. 
             \nHowever, some output might still be printed below (from asynchronous calls to \`print\`).`);
            log.show();
            } catch (error) {
                scriptRunError(error);
        }
        finally{
          return;
        }}, 
        (error:any)=>{eeInitError(error);}, 
        null, project);
  }catch(error){
    vscode.window.showErrorMessage("Error initializing earth engine token: \n" + error);
  }
}

export function scriptRunnerAsAccount(account:IPickedAccount, project: string | null, 
    context:vscode.ExtensionContext, log:vscode.OutputChannel){
  /*
  Runs a GEE script using a user account/project
  */
  const editor = vscode.window.activeTextEditor;
  if (editor) {
      let document = editor.document;
      const documentUri = document.uri;
      if (documentUri.scheme==='file'){
        getAccountToken(account, context.globalState, context)
        .then((token:any)=>{
          ee.data.setAuthToken('', 'Bearer', token, 3600, [], 
            ()=>scriptRunner(project, document, log, context.extensionUri)
          , false); 
        })
        .catch((err:any)=>{
            vscode.window.showErrorMessage(err);
            console.log(err);
        });
      }
  }
}

export function scriptRunnerAsServiceAccount(credentials:any, log:vscode.OutputChannel, context:vscode.ExtensionContext){
  /*
  Runs a GEE script using credentials from a service account 
  */
  const editor = vscode.window.activeTextEditor;
  if (editor) {
      let document = editor.document;
      const documentUri = document.uri;
      if (documentUri.scheme==='file'){
      ee.data.authenticateViaPrivateKey(credentials,
          ()=>scriptRunner(credentials.project, document, log, context.extensionUri),
          (error:any)=>{console.log("Error authenticating via private key. \n" + error);}
          ); 
      }
  }
}
