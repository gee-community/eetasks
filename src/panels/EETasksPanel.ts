/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as cp from "child_process";
var ee = require("@google/earthengine");

// Based on:
// https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/docs/getting-started.md

// IDEA: also show as JSON viewer
// IDEA: button to export as csv file.
// IDEA: Make datagrid similar to DataViewer.

function getPersistentCredentials(){
    // Credentials json file in ~/.config/earthengine/credentials
    // These are created by earthengine authenticate. 
    var os = require("os");
    var path = require("path");
    var fs = require("fs");

    const homedir = os.homedir();
    const credentialsFile = path.join(homedir, ".config", "earthengine", "credentials");
    let credentials = JSON.parse(fs.readFileSync(credentialsFile, "utf8").toString());
    return credentials;
}
function getEETokenFromPersistentCredentials(){
    let credentials = getPersistentCredentials();
    credentials.grant_type = "refresh_token";
    let command = "curl --location --request POST ";
    let oauthUrl = "https://oauth2.googleapis.com/token";
    command+="\"" + oauthUrl + "\" ";
    command+="--header \'Content-Type:application/json\' ";
    command+="--data-raw \'" + JSON.stringify(credentials) + "\'";
    let result = JSON.parse(
        cp.spawnSync(command,{shell:true})
        .stdout.toString()
        ); 
    return result.access_token;
}

function getEEToken(){
  const gcommand = "gcloud auth application-default print-access-token";
  return cp.spawnSync(gcommand,{shell:true})
  .stdout.toString().trim();
};

function eeInit(token:any){
    ee.apiclient.setAuthToken('', 'Bearer', token, 3600, [], undefined, false);
    ee.initialize();
}

// Set interval so that the token is refreshed every 3600 seconds. 
function refreshEE(){
    console.log("Refreshing EE");
    var token = getEETokenFromPersistentCredentials();
    //var token = getEEToken();
    eeInit(token);
}

function parseTasks(tasks:any){
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

export class EETasksPanel {
  public static currentPanel: EETasksPanel | undefined;
  private eeRefresher: NodeJS.Timer | undefined; 
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
  }

  public static render(extensionUri: vscode.Uri) {
    if (EETasksPanel.currentPanel) {
      EETasksPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const panel = vscode.window.createWebviewPanel("open-panel", "EE Tasks Panel", vscode.ViewColumn.One, {
    // Enable javascript in the webview
    enableScripts: true,
    // Restrict the webview to only load resources from the `out` directory
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
      });

      EETasksPanel.currentPanel = new EETasksPanel(panel, extensionUri);
    }
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
          <vscode-data-grid id="basic-grid" aria-label="Basic"></vscode-data-grid>
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
          case "refresh":
            var conf = vscode.workspace.getConfiguration("EEtasks"); 
            console.log("Refreshing tasks");
            refreshEE(); 
            this.eeRefresher = setInterval(refreshEE, 3600000);  // User tokens expire after 3600 seconds. 

            var tasks = ee.data.listOperations(conf.maxTasks);
            var table = parseTasks(tasks);
            console.log("Sending data to table.");
            webview.postMessage({command:"refreshTable", data:table});

           return;
        }
      },
      undefined,
      this._disposables
    );
  }
}