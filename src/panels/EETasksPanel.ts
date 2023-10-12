/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import os = require("os");
import * as cp from "child_process";
var ee = require("@google/earthengine"); 


// Based on:
// https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/docs/getting-started.md
  
export class EETasksPanel {
  public static currentPanel: EETasksPanel | undefined;
  private eeRefresher: NodeJS.Timer | number | undefined; 
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _token: string;
  private _extensionState: any; 
  private _account: string; 
  private _project: string; 
  private _privateKey: any; 
  private _ee: any;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, extensionState: any, 
    account: string, project: string, privateKey?: any) {
    this._extensionState = extensionState;
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
    this._account = account;  // Immutable for each panel.
    this._project = project;  // Immutable for each panel.
    this._privateKey = privateKey; // Immutable for each panel. 
    this._token = "";         // will get refreshed as needed. 

  }

private _getTasks(){
    console.log("Retrieving tasks list");
    let limit = vscode.workspace.getConfiguration("eetasks").limit; 
    // For windows, ee.data.listOperations only works with 
    // a callback function -- why?
    // in linux, it works either way. 
    ee.data.listOperations(limit, (tasks:any)=>{
        var table = this._parseTasks(tasks);
        if(table.length<1){
            vscode.window.showInformationMessage("No tasks found for "+this._account);
        }else{
        console.log("Sending tasks metadata to webview data-grid " + this._panel.title);
        }
        // Sending empty data is ok, as it will show "No tasks found." in the ui label. 
        this._panel.webview.postMessage({command:"refreshTable", data:table});
    }); 
  }

  private _asPrivateKey(){
    /*
    Entire process as private key
    We don't cache credentials.
    Simply authenticateviaPrivateKey, initialize, and send the tasks to the table.
    */
    // Init and task retrieval using service account. 
    // Will call this instad of the other methods. 
        // For service accounts we DON'T cache the credentials.
        // We are also using a different authentication method (not token). 
        this._account="service-account";
        console.log("Processing with private key");
        ee.data.authenticateViaPrivateKey(this._privateKey,
            ()=>{
            ee.initialize(null, null, 
            ()=>{
                try{
                    this._getTasks();
                }catch (error){
                    vscode.window.showErrorMessage("Error retrieving tasks \n " + error);
                }finally{
                    return;
                }
            }, 
            (error:any)=>{console.log("Error initializing with private key. \n"); console.log(error);},  // Error.. 
            null, null);  
            },
            (error:any)=>{console.log("Error authenticating via private key. \n" + error);}
            ); 
        return;
  }

  private _asAccount(){
    /*
    Entire process as account, re-using a previously cached token if available. 
    */
    // Do we have already have a token for this account?
    let tok = this._checkStateForExistingToken(); 
    let tokenExpiry = -1; // Assume previous token is expired (if exists). 
    if (tok.length>0){
        tokenExpiry = this._checkTokenExpiry(tok);
    }
    if (tokenExpiry<1){
        this._getToken();   // Less than 1 second -- renew token. 
    }else{
        console.log("Reusing valid token for " + this._account + " (panel:  " + this._panel.title + " )"); 
        this._token = tok;
    }
    ee.data.setAuthToken('', 'Bearer', this._token, 3600, [], 
    ()=>{
        ee.initialize(null, null,
        ()=>{
            try{
                ee.data.setProject(this._project);
                this._getTasks();
            }catch (error){
                vscode.window.showErrorMessage("Error retrieving tasks \n " + error);
            }finally{
                return;
            }
        },          
        (error:any)=>{console.log("Error initializing earth engine. \n"); console.log(error);}, 
        null, this._project); 
    }, 
    false);
  }

public init(){
    if (this._privateKey){
        this._asPrivateKey();  // Process as private key. 
        return;
    }else{
        this._asAccount(); // Process as account. 
    }
  }

  public static render(extensionUri: vscode.Uri, extensionState: any, account: string, project: string,
    privateKey?: any) {
    
    let panelName = "EE Tasks: " + account;
    if(project){
       panelName=panelName + " (" + project + ")"; 
    }

    const panel = vscode.window.createWebviewPanel("open-panel", panelName, vscode.ViewColumn.One, {
    // Enable javascript in the webview
    enableScripts: true,
    // Restrict the webview to only load resources from the `out` directory
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
      });
    EETasksPanel.currentPanel = new EETasksPanel(panel, extensionUri, extensionState, account, project, privateKey);
    return EETasksPanel.currentPanel;
  }

  public dispose() {
    clearInterval(this.eeRefresher);
    EETasksPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _checkStateForExistingToken(){
    // Checks for a cached token for this account. 
    // Returns a token (string) if it exists, otherwise returns "".
    let token = ""; 
    let tokens = this._extensionState.get("tokens"); 
    if(tokens){
        if (this._account in tokens){token = tokens[this._account];}
    }
    return token;
  }

  private _checkTokenExpiry(token:string | undefined){
    // Attempts to return token expiry ("expires_in" -- seconds)
    // Returns -1 if token is invalid
    let oauthUrl="https://oauth2.googleapis.com/tokeninfo?access_token=";
    let command = "curl \"" + oauthUrl + token + "\"";
    let result = JSON.parse(
        cp.spawnSync(command,{shell:true})
        .stdout.toString()
        ); 
    if (result.hasOwnProperty("error") || !(result.hasOwnProperty("expires_in"))){
        return -1;
    }else{
        return result.expires_in;
    }
  }

  private _getToken(){
    var token;
    console.log("Generating a new token for " + this._account);
    if(this._account==="earthengine"){
        token = this._getEETokenFromPersistentCredentials();
    }else{
        token = this._getEETokenFromGcloud(); 
    }

    // Check token. "" is BAD, otherwise assumed to be good
    // (already checked expiry and sent message if BAD)
    if(token.length>1){
        let tokens = this._extensionState.get("tokens");
        if(!tokens){
            tokens = {}; 
        }
        tokens[this._account] = token;
        this._extensionState.update("tokens", tokens); 
    }

    this._token = token;
  }

  private _getPersistentCredentials(){
      // Credentials json file in ~/.config/earthengine/credentials
      // This file is stored and managed by the earthengine cli:
      // https://developers.google.com/earth-engine/guides/command_line
      // This extension will never modify it, we only read it:
      var os = require("os");
      var path = require("path");
      var fs = require("fs");
      const homedir = os.homedir();
      const credentialsFile = path.join(homedir, ".config", "earthengine", "credentials");
      let credentials = JSON.parse(fs.readFileSync(credentialsFile, "utf8").toString());
      return credentials;
  }

  private _getEETokenFromPersistentCredentials(){
      // Gets a token from peristent credentials (account is "earthengine")
      // If successful, return the token and assign it to 
      // the state. Otherwise returns an empty token.
      let oauthUrl = "https://oauth2.googleapis.com/token";
      let credentials = this._getPersistentCredentials();
      credentials.grant_type = "refresh_token";
      let credentialsJSON = JSON.stringify(credentials);
      let command; 

     if(os.platform()==="win32"){
        command = "curl.exe --location --request POST ";
        command+="\"" + oauthUrl + "\" ";
        command+="--header \"Content-Type:application/json\" ";
        command+="--data-raw \"" + credentialsJSON.replace(/"/g,"\\\"") + "\"";
     }else{
      command = "curl --location --request POST ";
      command+="\"" + oauthUrl + "\" ";
      command+="--header \'Content-Type:application/json\' ";
      command+="--data-raw \'" + credentialsJSON + "\'";
     }

      let result = cp.spawnSync(command, {shell:true});
      let token = JSON.parse(result.stdout.toString()).access_token; 
     
      if (this._checkTokenExpiry(token)===-1){
          vscode.window.showErrorMessage("Error generating token using earthengine persistent credentials. " 
          + command + " \n Try re-authenticating using the python earthengine-api, or try using the gcloud method."
          + "\n Error message: \n" + result.stdout.toString(), {modal:true});
          return ""; // BAD token (length is 0).
      }else{
          return token; // GOOD token. 
         }
  }
  private _getEETokenFromGcloud(){   
    // This function is called if this._account is NOT "earthengine"
    let gcommand = "gcloud auth print-access-token " + this._account;
     if (this._account==="application-default"){
        gcommand = "gcloud auth application-default print-access-token";
    }
    let result = cp.spawnSync(gcommand,{shell:true});
    let token = result.stdout.toString().trim(); 
    if (this._checkTokenExpiry(token)===-1){
        vscode.window.showErrorMessage("Error generating token using `" 
        + gcommand + "` \n Try with another authentication method, or check the gcloud error message below: \n\n" + result.stderr, {modal:true});
        return ""; // BAD token (length is 0).
    }else{
        return token; // GOOD token. 
    }
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);

    const nonce = getNonce();

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Earth Engine Task Manager</title>
        </head>
        <body>
          <vscode-button id="refresh">🔄</vscode-button> 
          <p id="status-label"><p>
          <vscode-data-grid id="basic-grid" aria-label="Basic" generate-header="sticky"></vscode-data-grid>
           <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;

        switch (command) {
          case "init":
          case "refresh":
            this.init(); 
            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  private _parseTasks(tasks:any){
      var row, metadata, name, id;
      var data: { 
          Id: string; 
          Type: string;
          Description: string; 
          State: string; 
          CreateTime: string;
          EndTime: string;
          BatchEECU: string;
          }[] = []; 
      tasks.forEach((element: {metadata: any; name: any;}) => {
          name = element.name;
          metadata = element.metadata;
          id = name.split("/").pop(); 
          row = {
              Id:id, 
              Type: metadata.type,
              Description: metadata.description,
              State: metadata.state,
              CreateTime: metadata.createTime,
              EndTime: metadata.endTime,
              BatchEECU: metadata.batchEecuUsageSeconds
          };
          data.push(row);
      });
      return data;
  // TODO: 
  // attempt
  // destinationUris (array)
  // progress
  // scriptUri (if applicable)
  // stages (array)
      // completeWorkUnits
      // description
      // displayName
      // totalWorkUnits  
  // ^^ These could be added if user clicks on a specific row. 
  }

}