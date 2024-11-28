import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

export class Map {
  public static currentPanel: Map | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri){
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
  }

  public addLayer(url:any, name: string, shown: boolean, opacity: number){
    this._panel.webview.postMessage({command:"addLayer", url:url, name: name,
        shown: shown, opacity: opacity, options:{}});
  }

  public setView(center: any, zoom: any){
    this._panel.webview.postMessage({command:"setView", center:center, zoom:zoom});
  }

  public static render(extensionUri: vscode.Uri,) {
    let panelId = "eetasks-map"; 
    let panelTitle = "Earth Engine Map"; 
    let panelOptions = {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out'),
            vscode.Uri.joinPath(extensionUri, 'node_modules', 'leaflet', 'dist'),],
        retainContextWhenHidden: true
    };

    const panel = vscode.window.createWebviewPanel(panelId, panelTitle, vscode.ViewColumn.Beside, panelOptions);
    Map.currentPanel = new Map(panel, extensionUri);

    //panel.onDidChangeViewState((e)=>{
    //    if (e.webviewPanel.active){
    //        vscode.window.showInformationMessage('Panel ' + panelId + ' is in focus!');
    //    }else{
    //        console.log("OUT OF FOCUS");
    //    }
    //});

    return Map.currentPanel;
  }

  public dispose() {
    Map.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;

        switch (command) {
          case "log":
            vscode.window.showInformationMessage("HERE");
        }
      },
      undefined,
      this._disposables
    );
  }


  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const webviewUri = getUri(webview, extensionUri, ["out", "mapWebview.js"]);
    const leafletCssUri = getUri(webview, extensionUri, ["out", "leaflet.css"]);

    const nonce = getNonce();

    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leaflet Map</title>
      <link rel="stylesheet" href="${leafletCssUri}">
      <style>
        #map { height: 100vh; width: 100%; }
        .layer-control {
            display: none; /* grid */
            grid-template-columns: auto 1fr auto; /* Fixed columns: checkbox, label, slider */
            align-items: center; 
            gap: 5px; 
        }
        .layers-control {
            padding: 5px 15px 5px 10px;
            background: rgba(255,255,255,1);
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
            border-radius: 5px;
            font-family: "Open Sans", "Calibri", "Trebuchet MS", "Ubuntu", Serif;
            color: rgba(0,0,0,1); 
            display: flex;
            text-align: left;
            font-size: 12pt;
            flex-direction: column-reverse;
        }
        .layers-control:hover .layer-control {
                  display: grid;
        }
        .layers-control-title {
            padding: 0px 10px 0px 10px;
            order: 1;
        }
        .label {
            padding: 0px 0px 0px 3px;
        }

      </style>
    </head>
    <body>
      <div id="map"></div>
       <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
    </body>
    </html>     
    `;
  }

}
