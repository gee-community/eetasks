import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { getAccountToken } from "../utilities/getToken";
var ee = require("@google/earthengine"); 

export class EETasksPanel {
  public static currentPanel: EETasksPanel | undefined;
  private eeRefresher: NodeJS.Timer | number | undefined; 
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _extensionState: any; 
  private _account: string; 
  private _project: string | null; 
  private _privateKey: any; 

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, extensionState: any, 
    account: string, project: string | null, privateKey?: any) {
    this._extensionState = extensionState;
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
    this._account = account;  // Immutable for each panel.
    this._project = project;  // Immutable for each panel.
    this._privateKey = privateKey; // Immutable for each panel. 
  }

  /*
  This is the main call when the webview Panel is initialized, or 
  a refresh is requested. 
  */
  public init(){
    if (this._privateKey){
        this._asPrivateKey();  // Process as private key. 
    }else{
        this._asAccount(); // Process as account. 
    }
    return;
    }

  /*
  Authenticates ee using a service account (private key)
  and calls the main eeTasks function. 
  */
  private _asPrivateKey(){
      this._account="service-account";
      console.log("Processing with private key");
      ee.data.authenticateViaPrivateKey(this._privateKey,
          ()=>this._eeTasks(null),
          (error:any)=>{console.log("Error authenticating via private key. \n" + error);}
          ); 
      return;
  }


  /*
  Main ee initialization and callback to retrieve the ee tasks
  */
  private _eeTasks(project:any){
    ee.initialize(null, null, 
    ()=>{
        try{
            if(this._project){
              ee.data.setProject(this._project);
            }
            this._getTasks();
        }catch (error){
            vscode.window.showErrorMessage("Error retrieving tasks \n " + error);
        }finally{
            return;
        }
    }, 
    (error:any)=>{console.log("Error initializing earth engine. \n"); console.log(error);}, 
    null, project);
  }

  /*
  Retrieves tasks with a call to ee.data.listOperations and
  sends the tasks as a table to the webview. The table
  may be empty if no tasks are found. 
  */
  private _getTasks(){
      console.log("Retrieving tasks list");
      let limit = vscode.workspace.getConfiguration("eetasks").limit; 
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
  
  /*
  Parses the tasks list into a table. 
  
  TODO: 
  add extra columns currently not shown:
  - attempt
  - destinationUris (array)
  - progress
  - scriptUri (if applicable)
  - stages (array)
    - completeWorkUnits
    - description
    - displayName
    - totalWorkUnits  
  Some user interaction could be added to show more information. 
  */
  private _parseTasks(tasks:any){
  /* eslint-disable @typescript-eslint/naming-convention */
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
          EndTime: metadata.endTime || null,
          BatchEECU: metadata.batchEecuUsageSeconds || null
      };
      data.push(row);
    });
    return data;
  }


  /*
  Authenticates ee using a token associated to a user account.
  The token may be retrieved from the extension state (cache), 
  or a new one is generated and the extension state is updated. 
  Once ee is authenticated, it calls the main eeTasks function.
  */
  private _asAccount(){
      getAccountToken(this._account, this._extensionState)
      .then((token:any)=>{
          ee.data.setAuthToken('', 'Bearer', token, 3600, [], 
          ()=>this._eeTasks(this._project), false);
      })
      .catch((err:any)=>{
          vscode.window.showErrorMessage(err);
          console.log(err);
      });
  }

  /*
  The following are based on the vscode-webview-ui-toolkit example:
  https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/docs/getting-started.md
  */

  public static render(account: string, project: string | null,
    context: vscode.ExtensionContext,
    privateKey?: any) {
    let extensionUri = context.extensionUri;
    let extensionState = context.globalState;
    
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

}