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

function countState(data:[any], state:string){
    let N = 0;
    data.forEach((x)=>{
    if("State" in x){
        if(x["State"]===state){
            N+=1;
        }
    }
    });
    return N;
}

function updateTable(data:any){
const label = document.getElementById('status-label');
if (data.length<1){
  if(label){
  label.textContent = "No tasks found.";
  }
}else{
const statsLabel = document.getElementById('stats-label');
const grid = document.getElementById("basic-grid") as DataGrid; 
grid.rowsData = data; 
if(label){label.textContent = "";}
if(statsLabel){
    const nTotal = data.length;
    const nDone = countState(data, "SUCCEEDED");
    const nRunning = countState(data, "RUNNING");
    const nPending = countState(data, "PENDING");
    const nCancelled = countState(data, "CANCELLED");
    const nFailed = countState(data, "FAILED");

    statsLabel.textContent = `  ${nTotal} tasks in total  `+
    `|  COMPLETED: ${nDone}   `+
    `|  RUNNING: ${nRunning}   `+
    `|  PENDING: ${nPending}   `+
    `|  CANCELLED: ${nCancelled}`+
    `|  FAILED: ${nFailed}`;
  }
}

vscode.setState(data);
}