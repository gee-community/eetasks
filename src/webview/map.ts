var L = require("leaflet"); 
var map:any;
const vscode = acquireVsCodeApi();

window.addEventListener("load", onLoad);
window.addEventListener("message", messageFromExtension);

function onLoad() {
  const mapContainer = document.getElementById("map"); 
  map = L.map(mapContainer).setView([34.80, -95.2], 4);
  // https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
  // '&copy; OpenStreetMap contributors
  // TODO: add a basemap selector widget..
  var basemap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}');
  basemap.addTo(map);

  // Initialize the layers control with the basemap
  var basemapCtrl = singleLayerControl(basemap, 'Basemap', true, 1);
  var layersCtrlTitle = L.DomUtil.create('output', 'layers-control-title');
  layersCtrlTitle.value="Layers";

  // Prepare the layers control widget
  map._layersControl = L.control({
    position:'topright'
  });

  map._layersControl.onAdd = function(){
    this._div = L.DomUtil.create('div', 'layers-control');

    this._div.appendChild(layersCtrlTitle);
    this._div.appendChild(basemapCtrl);

    // Prevent the whole div from dragging the map
    this._div.addEventListener('mousedown', function(e: any) {
        L.DomEvent.stopPropagation(e);
    });
    this._div.addEventListener('dblclick', function(e: any) {
        L.DomEvent.stopPropagation(e);
    });

   
    return this._div;
    };
  map._layersControl.addTo(map);


}

function singleLayerControl(layer:any, name:string, visible:boolean, opacity:number){
    // Creates a single layer Control 
    // [x] Label -----o--
    var c = L.DomUtil.create('div', 'layer-control');
    var chk = L.DomUtil.create('input', 'checkbox');
    chk.type="checkbox";
    chk.checked = visible;
    c.appendChild(chk);
    var caption = L.DomUtil.create('output', 'label');
    caption.value=name;
    c.appendChild(caption);
    var slider = L.DomUtil.create('input', 'slider');
    slider.type='range';
    slider.min=0;
    slider.max=1;
    slider.step=0.01;
    slider.value=opacity;
    c.appendChild(slider);

    chk.addEventListener('change', function(){
        const isChecked = chk.checked;
        const opacity = slider.value;
        if(isChecked){
            layer.setOpacity(opacity);
        }else{
            layer.setOpacity(0);
        }

    });

    slider.addEventListener('input', function(){
        const isChecked = chk.checked;
        const opacity = slider.value;
        if(isChecked){
            layer.setOpacity(opacity);
        }
    });

    return c;
}


function addLayer(url:any, name:string, shown: boolean=true, opacity: number=1, ...options:any){
    var l = L.tileLayer(url, ...options);
    l.name = name;
    l.addTo(map);
    if(shown){
        l.setOpacity(opacity);
    }else{
        l.setOpacity(0);
    }

    var lCtrl = singleLayerControl(l, name, shown, opacity);
    map._layersControl._div.appendChild(lCtrl);

}

function setView(center:any, zoom: any){
    map.setView(center, zoom);
}

function messageFromExtension(event:any){
    const message = event.data; 
    const command = message.command;
    switch (command){
      case "addLayer":
        addLayer(message.url, message.name, message.shown, message.opacity, message.options);
        return;
      case "setView":
        setView(message.center, message.zoom);
        return;
    }
}