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
import { getAccountToken } from './getToken';
import { mkdtemp, rmdir } from 'node:fs/promises';
import path = require("path");
import os = require("os");
import fs = require("fs");
var ee = require("@google/earthengine"); 
const scriptPrefix = "exports.main=function(ee,ceu, onTaskStart, onTaskStartError, vslog){" +
"var log=ceu.Log(vslog);" +
"var print=ceu.Print(log);var Map=ceu.Map; " +
"Export = new ceu.Export(ee, onTaskStart, onTaskStartError);";
const scriptSuffix = "\n}";

var codeEditorUtils = require("./codeEditorUtils.js");

function onTaskStart(){
    vscode.window.showInformationMessage("Successfully submitted task");
}

function onTaskStartError(err:any){
    vscode.window.showErrorMessage("Failed to start EE task: \n " + err);
}

function scriptRunError(err:any){
    vscode.window.showErrorMessage("EE script run failed: \n " + err);
}

function eeInitError(err:any){
    vscode.window.showErrorMessage("EE initialization failed: \n " + err);
}

function scriptRunner(project:string | null, document:vscode.TextDocument, log:vscode.OutputChannel){
  try{
    ee.initialize(null, null, 
    ()=>{
        try{
          if(project){
            ee.data.setProject(project);
          }
          // Create a temporary directory:
          mkdtemp(path.join(os.tmpdir(), 'eetasksRunner-'))
          .then((tempDir:string)=>{
              // Create the file to run in the temporary directory
              let tempFile = path.join(tempDir, "temp.js"); 
              //🔲 TODO: random name instead of temp.js
              let tempUri = vscode.Uri.file(tempFile);
              //🔲 TODO: replace with vscode.workspace.fs.writeFile
              fs.writeFile(tempFile, 
              scriptPrefix + document.getText() + scriptSuffix, () => {
                  try{
                  const userCode = require(tempFile);
                  try{
                  log.appendLine("Starting GEE script run: ");
                  log.appendLine(document.fileName);
                  log.appendLine("----------------------------------");
                  userCode.main(ee, codeEditorUtils,
                    onTaskStart, onTaskStartError, log);
                  log.show();
                  }catch(error){scriptRunError(error);}
                  }catch(error){scriptRunError(error);}
                  // Delete the temporary file and directory,
                  // even if the script failed. 
                  vscode.workspace.fs.delete(tempUri).then(
                      ()=>rmdir(tempDir));
                  }); // fs.writeFile
                }); // mkdtemp
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

export function scriptRunnerAsAccount(account:string, project: string | null, 
    context:vscode.ExtensionContext, log:vscode.OutputChannel){
  /*
  Runs a GEE script using a user account/project
  */
  const editor = vscode.window.activeTextEditor;
  if (editor) {
      let document = editor.document;
      const documentUri = document.uri;
      if (documentUri.scheme==='file'){
        getAccountToken(account, context.globalState)
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