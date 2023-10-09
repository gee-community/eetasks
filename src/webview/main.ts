/* eslint-disable @typescript-eslint/naming-convention */
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, Button, DataGrid} from "@vscode/webview-ui-toolkit";

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
  // State is directly the table data. 
  const previousState = vscode.getState();
  let ok = previousState ? true: false;
  if(ok){updateTable(previousState);}else{

  const label = document.getElementById('status-label');
  if(label){
  label.textContent = "Retrieving tasks...";
  }
  // Send the command for initialization.
  vscode.postMessage({
      command:"init"
  });
  }

}
function handleRefreshClick() {
  vscode.postMessage({
    command: "refresh"
  });
}

function updateTable(data:any){
if (data.length<1){
  const label = document.getElementById('status-label');
  if(label){
  label.textContent = "No tasks found.";
  }

}else{
const grid = document.getElementById("basic-grid") as DataGrid; 
grid.rowsData = data; 
const label = document.getElementById('status-label');
if(label){label.textContent = "";}
}

vscode.setState(data);
}