/* eslint-disable @typescript-eslint/naming-convention */
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, Button, DataGrid } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDataGrid(), vsCodeDataGridCell(), vsCodeDataGridRow());

const vscode = acquireVsCodeApi();

window.addEventListener("load", main);
window.addEventListener("message", messageFromExtension);

function messageFromExtension(event:any){
    const message = event.data; 
    const command = message.command;
    switch (command){
      case "refreshTable":
        updateTable(message.data);
        return;
    }
}

function main() {
  const refreshButton = document.getElementById("refresh") as Button;
  refreshButton?.addEventListener("click", handleRefreshClick);

  // Check if we have an old state to restore from?
  const previousState = vscode.getState();

  // If we have a previous state, update the Table
  // using it. Otherwise request it from the extension.
  let ok = previousState ? true: false;
  
  if(ok){
    updateTable(previousState);
  }else{
    // Request refresh data. 
    vscode.postMessage({command:"refresh"});
  }
}

function handleRefreshClick() {
  vscode.postMessage({
    command: "refresh"
  });
}

function updateTable(data:any){
const grid = document.getElementById("basic-grid") as DataGrid; 
grid.rowsData = data; 
vscode.setState(data);
}