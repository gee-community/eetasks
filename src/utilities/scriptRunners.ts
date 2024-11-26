/*
Helpers to run GEE scripts from within vscode. 

A GEE script is written to a temporary file consisting of:

scriptPrefix (see below)
USER-PROVIDED-CODE
scriptSuffix (a single closing curly brace '}' )

Basically, the user script is wrapped into a "main"
function that receives the ee library, the additional 
"code Editor"-like utilities*, as well as a successCallback
and errorCallback functions to handle when a task is 
successfully submitted or fails to submit. 

The temporary script is require()d `const userCode = require(tempFile)`
and then the main function is called `userCode.main(...)`
If there is an error with the script itself, it is catched and raised.
Finally, the temporary file is deleted.

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
- Map, ui, and Chart: empty skeleton classes with functions accepting
the same arguments as in the Code Editor, but doing nothing, i.e., 
any user code calling thee functions is silently ignored. 

❗ TODO: fix Windows-vscode-specific issue: 
https://stackoverflow.com/questions/77436205/synchronous-function-call-to-external-library-within-vscode-freezes-only-in-wind
Basically, synchronous calls to some ee functions (most notably getInfo)
will crash the extension. This does not affect Linux users.
It's also unlikely to be a bug in ee itself, as the issue doesn't occur
in nodejs directly.  
*/
import * as vscode from 'vscode';
import { IPickedAccount } from './accountPicker';
import { getAccountToken } from './getToken';
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

function scriptRunner(project:string | null, document:vscode.TextDocument, log:vscode.OutputChannel){
  let onTaskStart = wrapOnTaskStart(log);
  let onTaskStartError = wrapOnTaskStartError(log);
  try{
    ee.initialize(null, null, 
    async ()=>{
        try{
          if(project){
            ee.data.setProject(project);
          }
          try {
            const code = `
              export const runEECode = (ee,ceu, onTaskStart, onTaskStartError, vslog) => {
                var log=ceu.Log(vslog);
                var print=ceu.Print(log);
                var Map=new ceu.Map(ee, onTaskStart, onTaskStartError);
                var Chart=ceu.Chart;
                var ui = ceu.ui;
                var Export = new ceu.Export(ee, onTaskStart, onTaskStartError);
                ${document.getText()}
              };
            `;
            const blob = `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;
            const module = await import(blob);
            module.runEECode(ee, codeEditorUtils, onTaskStart, onTaskStartError, log); 

            } catch (error) {
                scriptRunError(error);
            }
        }catch (error){
          scriptRunError(error);
        }finally{
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
            ()=>scriptRunner(project, document, log)
          , false); 
        })
        .catch((err:any)=>{
            vscode.window.showErrorMessage(err);
            console.log(err);
        });
      }
  }
}

export function scriptRunnerAsServiceAccount(credentials:any, log:vscode.OutputChannel){
  /*
  Runs a GEE script using credentials from a service account 
  */
  const editor = vscode.window.activeTextEditor;
  if (editor) {
      let document = editor.document;
      const documentUri = document.uri;
      if (documentUri.scheme==='file'){
      ee.data.authenticateViaPrivateKey(credentials,
          ()=>scriptRunner(credentials.project, document, log),
          (error:any)=>{console.log("Error authenticating via private key. \n" + error);}
          ); 
      }
  }
}