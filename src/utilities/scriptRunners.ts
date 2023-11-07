/*
Helpers to run GEE scripts.
*/
import * as vscode from 'vscode';
import { getAccountToken } from './getToken';
import { mkdtemp, rmdir } from 'node:fs/promises';
import path = require("path");
import os = require("os");
import fs = require("fs");
const scriptPrefix = "exports.main=function(ee,ceu,errCallback){" +
"var print=ceu.print;var Map=ceu.Map; " +
"Export=ceu.ExportMod(ee.batch.Export, errCallback); \n";
var codeEditorUtils = require("./codeEditorUtils.js");
function taskStartError(err:any){
    vscode.window.showErrorMessage("Failed to start EE task: \n " + err);
}

function scriptRunError(err:any){
    vscode.window.showErrorMessage("EE script run failed: \n " + err);
}

function eeInitError(err:any){
    vscode.window.showErrorMessage("EE initialization failed: \n " + err);
}

export function scriptRunner(account:string, project: string | null, context:vscode.ExtensionContext){
  /*
  Runs a GEE script using a user account/project
  */
  const editor = vscode.window.activeTextEditor;
  if (editor) {
      var ee = require("@google/earthengine"); 
      let document = editor.document;
      const documentUri = document.uri;
      if (documentUri.scheme==='file'){
        getAccountToken(account, context.globalState)
        .then((token:any)=>{
          ee.data.setAuthToken('', 'Bearer', token, 3600, [], 
            ()=>{
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
                      // TODO: random name instead of temp.js
                      let tempUri = vscode.Uri.file(tempFile);
                      fs.writeFile(tempFile, 
                      scriptPrefix + document.getText() + "\n}", () => {
                          try{
                          const userCode = require(tempFile);
                          try{
                          /*
                          Note: 
                          Issue in windows when calling some ee 
                          functions synchronously. See:
                          https://stackoverflow.com/questions/77436205/synchronous-function-call-to-external-library-within-vscode-freezes-only-in-wind
                          In node/windows, node/linux, 
                          and vscode/linux this is not an issue.
                          */
                          userCode.main(ee, codeEditorUtils, taskStartError);
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
                null, project); // ee.initialize
          }
          catch(error){
            vscode.window.showErrorMessage("Error retrieving earth engine token: \n" + error);
          }
          }, false); // ee.setAuthToken
        })
        .catch((err:any)=>{
            vscode.window.showErrorMessage(err);
            console.log(err);
        });
      }
  }
}