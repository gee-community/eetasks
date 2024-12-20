/*
  Implementation of the code Editor Map
  Currently only `setCenter` and `addLayer` are implemented.
*/
import { Map } from "../panels/Map";

export class EEMap{
    ee: any;
    private _openMapPanelIfNeeded: () => void;
    private _vsMapPanel: Map | undefined;
    setCenter: (lon: any, lat: any, zoom: any) => void;
    addLayer: (eeObject: any, visParams: any, name: any, shown: any, opacity: any) => void;
    // NOT YET IMPLEMENTED:
    add=function(){};
    centerObject=function(){};
    clear=function(){};
    drawingTools=function(){};
    getBounds=function(){};
    getCenter=function(){};
    getScale=function(){};
    getZoom=function(){};
    layers=function(){};
    onChangeBounds=function(){};
    onChangeCenter=function(){};
    onChangeZoom=function(){};
    onClick=function(){};
    onIdle=function(){};
    onTileLoaded=function(){};
    remove=function(){};
    setControlVisibility=function(){};
    setGestureHandling=function(){};
    setZoom=function(){};
    style=function(){};
    unlisten=function(){};
    widgets=function(){};

    constructor(ee:any, uri:any){
       this.ee = ee;
       this._openMapPanelIfNeeded = function(){
       if (typeof this._vsMapPanel === 'undefined'){
           this._vsMapPanel = Map.render(uri);
       }
       };
       this.setCenter=function(lon,lat,zoom){
           this._openMapPanelIfNeeded();
           const coord = [lat, lon];
           if(this._vsMapPanel){
            this._vsMapPanel.setView(coord, zoom);
           }
       };
       this.addLayer=function(eeObject,visParams,name,shown,opacity){
           this._openMapPanelIfNeeded();
           let ee = this.ee;
           if (typeof eeObject.mosaic === 'function'){
               // ImageCollection has a `mosaic` method:
               eeObject = eeObject.mosaic(); 
           }else{
            /*
                Here we check if the object is ee.Geometry, 
                ee.Feature, or ee.FeatureCollection
                We can check if it has a `centroid`
                or `aggregate_array` method for now, until
                a better method is implemented.
            */
               if(typeof eeObject.centroid === 'function' || typeof eeObject.aggregate_array === 'function'){
                   var features = ee.FeatureCollection(eeObject);
                   var color = visParams && visParams.color ? visParams.color : '000000';
                   var width = visParams && visParams.width ? visParams.width : 2;
                   var imageOutline = features.style({
                       color: color,
                       fillColor: '00000000',
                       width: width
                   });
                   eeObject = features.style({fillColor: color})
                   .updateMask(ee.Image.constant(0.5))
                   .blend(imageOutline);
               }
           }
           const request = ee.data.images.applyVisualization(eeObject, visParams);
           const mapId = ee.data.getMapId(request);
           if(this._vsMapPanel){
            this._vsMapPanel.addLayer(mapId.urlFormat, name, shown, opacity);
           }
       };   

   }
};

