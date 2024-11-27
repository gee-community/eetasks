var L = require("leaflet"); 
var map:any;
const vscode = acquireVsCodeApi();

window.addEventListener("load", main);
window.addEventListener("message", messageFromExtension);

function main() {
  const mapContainer = document.getElementById("map"); 
  map = L.map(mapContainer).setView([34.80, -95.2], 4);
  // https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
  // '&copy; OpenStreetMap contributors
  L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}').addTo(map);
}

function addLayer(url:any, ...options:any){
    L.tileLayer(url, ...options).addTo(map);
}

function setView(center:any, zoom: any){
    map.setView(center, zoom);
}

function messageFromExtension(event:any){
    const message = event.data; 
    const command = message.command;
    switch (command){
      case "addLayer":
        addLayer(message.url, message.options);
        return;
      case "setView":
        setView(message.center, message.zoom);
        return;
    }
}