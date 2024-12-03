/* eslint-disable @typescript-eslint/naming-convention */
/*
Code editor utilities.
- print: mirrors the functionality of print in the Code Editor. See:
    https://developers.google.com/earth-engine/apidocs/print
- Export: mirrors the structure of Export in the Code Editor, with functions
    named identically as in the code Editor, internally wrapping them from
    ee.batch.Export. 
    ⚠️ In contrast to the code Editor, tasks
    are automatically started with a successCallback/errorCallback. 
    This is an added feature of the extension. 
    ⚠️ Another contrast is that the code Editor defines some default values
    for parameters such as description, fileNamePrefix, assetId, etc. Some of 
    could be implemented here (See 🔲 TODO's below), but not all. Therefore
    submission of tasks without these defaults will raise the errorCallback.  
    See:
    https://developers.google.com/earth-engine/apidocs/export-image-toasset
    https://developers.google.com/earth-engine/apidocs/export-image-tocloudstorage
    https://developers.google.com/earth-engine/apidocs/export-image-todrive
    https://developers.google.com/earth-engine/apidocs/export-map-tocloudstorage
    https://developers.google.com/earth-engine/apidocs/export-table-toasset
    https://developers.google.com/earth-engine/apidocs/export-table-tobigquery
    https://developers.google.com/earth-engine/apidocs/export-table-tocloudstorage
    https://developers.google.com/earth-engine/apidocs/export-table-todrive
    https://developers.google.com/earth-engine/apidocs/export-table-tofeatureview
    https://developers.google.com/earth-engine/apidocs/export-video-tocloudstorage
- Map: currently only Map.setCenter and Map.addLayer are implemented.
    The rest are empty so they can be silently ignored. 
    Map.addLayer currently only works for ee.Image
- ui, and Chart: empty skeleton classes with functions accepting
the same arguments as in the Code Editor, but doing nothing, i.e., 
any user code calling thee functions is silently ignored. 
*/


exports.Log = function(log){
    return function(...args){
      args.forEach((line)=>{
      if(line){
        if(typeof line==="object"){
            log.appendLine(JSON.stringify(line));
        }else{
            log.appendLine(line.toString());
        }
      }
    });
    };
};

/*
Wraps a function to print one or more arguments
to a given log (vscode.window.OutputChannel)
If an argument is an object with the getInfo method,
then getInfo() is called asynchronously. 
*/
exports.Print = function(log){
    return function(...args){
      args.forEach((object)=>{
      if(object){
        if (typeof object === "object"){
            if ("getInfo" in object){
                object.getInfo(log);
            }else{
            log(object);
            }
        }else{
            log(object);
        }
      }
      });
    };
};

/* ExportImage: wrapper for ee.batchExport.image.toXXX 
functions, but also starts the tasks automatically.
*/
class ExportImage {
    constructor(ee, successCallback, errCallback){
        this.toAsset = function(...args){
          var computed = false;
          var clientConfig = ee.arguments.extractFromFunction(
              ee.batch.Export.image.toAsset, arguments);
          if(!Object.hasOwn(clientConfig,"description")){
              clientConfig["description"] = "myEETasksExportImageTask";
          }
          //🔲 TODO: assetId default to
          // projects/PROJECT/assets/ + description
          if (Object.hasOwn(clientConfig, "region")){
            var region = clientConfig["region"];
            if (region.func){
              computed = true;
              region.evaluate(
                  (r)=>{
              clientConfig["region"] = r;
              return ee.batch.Export.image.toAsset(clientConfig)
              .start(successCallback, errCallback);
                  }
              );
            }
            if (!computed){
            return ee.batch.Export.image.toAsset(clientConfig)
            .start(successCallback, errCallback);
           }
           }
        };

        this.toCloudStorage = function(...args){
          var computed = false;
          var clientConfig = ee.arguments.extractFromFunction(
              ee.batch.Export.image.toCloudStorage, arguments);
          if(!Object.hasOwn(clientConfig,"description")){
              clientConfig["description"] = "myEETasksExportImageTask";
          }
          if(!Object.hasOwn(clientConfig,"fileNamePrefix")){
              clientConfig["fileNamePrefix"] = clientConfig["description"];
          }
          if (Object.hasOwn(clientConfig, "region")){
            var region = clientConfig["region"];
            if (region.func){
              computed=true;
              region.evaluate(
                  (r)=>{
              clientConfig["region"] = r;
              return ee.batch.Export.image.toCloudStorage(clientConfig)
              .start(successCallback, errCallback);
                  }
              );
            }
          }
          if (!computed){
            return ee.batch.Export.image.toCloudStorage(clientConfig)
            .start(successCallback, errCallback);
          }
        };

        this.toDrive = function(...args){
          var computed = false;
          var clientConfig = ee.arguments.extractFromFunction(
              ee.batch.Export.image.toDrive, arguments);
          if(!Object.hasOwn(clientConfig,"description")){
              clientConfig["description"] = "myEETasksExportImageTask";
          }
          if(!Object.hasOwn(clientConfig,"fileNamePrefix")){
              clientConfig["fileNamePrefix"] = clientConfig["description"];
          }
          if (Object.hasOwn(clientConfig, "region")){
            var region = clientConfig["region"];
            if (region.func){
              computed=true;
              region.evaluate(
                  (r)=>{
              clientConfig["region"] = r;
              return ee.batch.Export.image.toDrive(clientConfig)
              .start(successCallback, errCallback);
                  }
              );
            }
          }
          if (!computed){
            return ee.batch.Export.image.toDrive(clientConfig)
            .start(successCallback, errCallback);
          }
        };
    }
}

/* ExportMap: wrapper for ee.batchExport.map.toXXX 
functions, but also starts the tasks automatically.
🔲 TODO: defaults?
*/
class ExportMap {
    constructor(ee, successCallback, errCallback){
        this.toCloudStorage = function(...args){
            return ee.batch.Export.map.toCloudStorage(...args)
            .start(successCallback, errCallback);
        };
    }
}

/* ExportVideo: wrapper for ee.batchExport.video.toXXX 
functions, but also starts the tasks automatically.
🔲 TODO: defaults?
*/
class ExportVideo {
    constructor(ee, successCallback, errCallback){
        this.toCloudStorage = function(...args){
            return ee.batch.Export.video.toCloudStorage(...args)
            .start(successCallback, errCallback);
        };
    }
}

/* ExportTable: wrapper for ee.batchExport.table.toXXX 
functions, but also starts the tasks automatically.
🔲 TODO: description default to myExportTableTask
*/
class ExportTable {
    constructor(ee, successCallback, errCallback){
        this.toAsset = function(...args){
        //🔲 TODO: assetId default to
        // projects/PROJECT/assets/ + description
            return ee.batch.Export.table.toAsset(...args)
            .start(successCallback, errCallback);
        };
        this.toCloudStorage = function(...args){
        //🔲 TODO: fileNamePrefix default to description
        //🔲 TODO: bucket default?
            return ee.batch.Export.table.toCloudStorage(...args)
            .start(successCallback, errCallback);
        };
        this.toDrive = function(...args){
        //🔲 TODO: fileNamePrefix default to description
            return ee.batch.Export.table.toDrive(...args)
            .start(successCallback, errCallback);
        };
        this.toBigQuery = function(...args){
        //🔲 TODO: defaults?
            return ee.batch.Export.table.toBigQuery(...args)
            .start(successCallback, errCallback);
        };
        this.toFeatureView = function(...args){
        //🔲 TODO: defaults?
            return ee.batch.Export.table.toFeatureView(...args)
            .start(successCallback, errCallback);
        };
    }
}

class ExportConstructor{
    constructor(ee, successCallback, errCallback){
        this.table = new ExportTable(ee, successCallback, errCallback);
        this.image = new ExportImage(ee, successCallback, errCallback);
        this.map = new ExportMap(ee, successCallback, errCallback);
        this.video = new ExportVideo(ee, successCallback, errCallback);
    }
}
exports.Export = ExportConstructor;
   
/*
The rest are defined to be silently ignored:
Map
Chart
ui
*/

class MapConstructor{
   /*
   Map Class

   Functional:
    - setCenter
    - addLayer (only ee.Image)

   All other function are defined similarly as in 
   the code editor but are silently ignored.
   */
   constructor(ee, successCallback, errCallback, vsMap, vsUri){
    this._vsMapPanel = undefined; 
    this._openMapPanelIfNeeded = function(){
        if (typeof this._vsMapPanel === 'undefined'){
            this._vsMapPanel = vsMap.render(vsUri);
        }
    };

    this.add=function(item){};

    this.setCenter=function(lon,lat,zoom){
      this._openMapPanelIfNeeded();

      const coord = [lat, lon];
      this._vsMapPanel.setView(coord, zoom);

    };
    this.addLayer=function(eeObject,visParams,name,shown,opacity){
        this._openMapPanelIfNeeded();

        if (typeof eeObject.mosaic === 'function'){
            // ImageCollection has a `mosaic` method:
            eeObject = eeObject.mosaic(); 
        }else{
            // Both geometry and feature have a `centroid` method
            // FeatureCollection has the `aggregate_array` method
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
        this._vsMapPanel.addLayer(mapId.urlFormat, name, shown, opacity);
   };   
   
   this.centerObject=function(object,zoom,onComplete){};
   this.clear=function(){};
   this.drawingTools=function(){};
   this.getBounds=function(asGeoJSON){};
   this.getCenter=function(){};
   this.getScale=function(){};
   this.getZoom=function(){};
   this.layers=function(){};
   this.onChangeBounds=function(callback){};
   this.onChangeCenter=function(callback){};
   this.onChangeZoom=function(callback){};
   this.onClick=function(callback){};
   this.onIdle=function(callback){};
   this.onTileLoaded=function(callback){};
   this.remove=function(item){};
   this.setControlVisibility=function(all,layerList,zoomControl,scaleControl,
    mapTypeControl,fullscreenControl,drawingToolsControl){};
   this.setGestureHandling=function(option){};
   this.setZoom=function(zoom){};
   this.style=function(){};
   this.unlisten=function(idOrType){};
   this.widgets=function(){};
    }

}

exports.Map = MapConstructor;

/* Mock implementation of ui, so that
   they can be ignored in the user code without raising
   errors. 
   Some of this could be implemented to work with the 
   leaflet map..
*/
const ui = {
  Button: function(){
    return {
      getDisabled:function(){},
      getImageUrl:function(){},
      getLabel:function(){},
      onClick:function(){},
      setDisabled:function(){},
      setImageUrl:function(){},
      setLabel:function(){},
      style:function(){},
      unlisten:function(){},
    };
  },
  Chart: function () {
    return {
      getChartType: function(){},
      getDataTable:function(){},
      getDownloadable:function(){},
      getOptions:function(){},
      getView:function(){},
      onClick:function(){},
      setChartType:function(){},
      setDataTable:function(){},
      setDownloadable:function(){},
      setOptions:function(){},
      setSeriesNames:function(){},
      setView:function(){},
      style:function(){},
      unlisten:function(){},
    };
  },
  Checkbox: function(){
    return {
        getDisabled:function(){},
        getLabel:function(){},
        getValue:function(){},
        onChange:function(){},
        setDisabled:function(){},
        setLabel:function(){},
        setValue:function(){},
        style:function(){},
        unlisten:function(){},       
    };
  },
  DateSlider: function(){
    return {
        getDisabled:function(){},
        getEnd:function(){},
        getPeriod:function(){},
        getStart:function(){},
        getValue:function(){},
        onChange:function(){},
        setDisabled:function(){},
        setEnd:function(){},
        setPeriod:function(){},
        setStart:function(){},
        setValue:function(){},
        style:function(){},
        unlisten:function(){},
    };
  },
  Label: function(){
    return {
        getImageUrl:function(){},
        getUrl:function(){},
        getValue:function(){},
        setImageUrl:function(){},
        setUrl:function(){},
        setValue:function(){},
        style:function(){},
    };
  },
  Map: function(){
    return {
        add:function(){},
        addLayer:function(){},
        centerObject:function(){},
        clear:function(){},
        drawingTools:function(){},
        getBounds:function(){},
        getCenter:function(){},
        getScale:function(){},
        getZoom:function(){},
        insert:function(){},
        layers:function(){},
        onChangeBounds:function(){},
        onChangeCenter:function(){},
        onChangeZoom:function(){},
        onClick:function(){},
        onIdle:function(){},
        onTileLoaded:function(){},
        remove:function(){},
        setCenter:function(){},
        setControlVisibility:function(){},
        setGestureHandling:function(){},
        setLocked:function(){},
        setOptions:function(){},
        setZoom:function(){},
        style:function(){},
        unlisten:function(){},
        widgets:function(){},
    };
  },
  Panel: function(){
    return {
        add:function(){},
        clear:function(){},
        getLayout:function(){},
        insert:function(){},
        remove:function(){},
        setLayout:function(){},
        style:function(){},
        widgets:function(){},
    };
  },
  Select: function(){
    return{
        getDisabled:function(){},
        getPlaceholder:function(){},
        getValue:function(){},
        items:function(){},
        onChange:function(){},
        setDisabled:function(){},
        setPlaceholder:function(){},
        setValue:function(){},
        style:function(){},
        unlisten:function(){},
    };
  },
  Slider: function(){
    return{
        getDisabled:function(){},
        getMax:function(){},
        getMin:function(){},
        getStep:function(){},
        getValue:function(){},
        onChange:function(){},
        onSlide:function(){},
        setDisabled:function(){},
        setMax:function(){},
        setMin:function(){},
        setStep:function(){},
        setValue:function(){},
        style:function(){},
        unlisten:function(){},
    };
  },
  SplitPanel: function(){
    return{
        getFirstPanel:function(){},
        getOrientation:function(){},
        getPanel:function(){},
        getSecondPanel:function(){},
        getWipe:function(){},
        setFirstPanel:function(){},
        setOrientation:function(){},
        setPanel:function(){},
        setSecondPanel:function(){},
        setWipe:function(){},
        style:function(){},
        unlisten:function(){},
    };
  },
  Textbox: function(){
    return{
        getDisabled:function(){},
        getPlaceholder:function(){},
        getValue:function(){},
        onChange:function(){},
        setDisabled:function(){},
        setPlaceholder:function(){},
        setValue:function(){},
        style:function(){},
        unlisten:function(){},
    };
  },
  Thumbnail: function(){
    return{
        getImage:function(){},
        getParams:function(){},
        onClick:function(){},
        setImage:function(){},
        setParams:function(){},
        style:function(){},
        unlisten:function(){},
    };
  },
};

ui.Chart.array = {
    values: function(){return ui.Chart();},
};
ui.Chart.feature = {
  byFeature: function () {return ui.Chart();},
  byProperty: function () {return ui.Chart();},
  groups: function () {return ui.Chart();},
  histogram: function () {return ui.Chart();},
};
ui.Chart.image = {
  byClass: function () {return ui.Chart();},
  byRegion: function () {return ui.Chart();},
  doySeries: function () {return ui.Chart();},
  doySeriesByRegion: function () {return ui.Chart();},
  histogram: function () {return ui.Chart();},
  regions: function () {return ui.Chart();},
  series: function () {return ui.Chart();},
  seriesByRegion: function () {return ui.Chart();},
};
ui.Map.CloudStorageLayer = function(){
    const m = {}; 
    m.getBucket = function(){};
    m.getBucket=function(){};
    m.getMaxZoom=function(){};
    m.getName=function(){};
    m.getOpacity=function(){};
    m.getPath=function(){};
    m.getShown=function(){};
    m.getSuffix=function(){};
    m.setBucket=function(){};
    m.setMaxZoom=function(){};
    m.setName=function(){};
    m.setOpacity=function(){};
    m.setPath=function(){};
    m.setShown=function(){};
    m.setSuffix=function(){};
    return m;
};
ui.Map.DrawingTools = function(){
    const m = {};
    m.addLayer=function(){};
    m.clear=function(){};
    m.draw=function(){};
    m.edit=function(){};
    m.get=function(){};
    m.getDrawModes=function(){};
    m.getLinked=function(){};
    m.getMap=function(){};
    m.getSelected=function(){};
    m.getShape=function(){};
    m.getShown=function(){};
    m.layers=function(){};
    m.onDraw=function(){};
    m.onEdit=function(){};
    m.onErase=function(){};
    m.onLayerAdd=function(){};
    m.onLayerConfig=function(){};
    m.onLayerRemove=function(){};
    m.onLayerSelect=function(){};
    m.onSelect=function(){};
    m.onShapeChange=function(){};
    m.set=function(){};
    m.setDrawModes=function(){};
    m.setLinked=function(){};
    m.setSelected=function(){};
    m.setShape=function(){};
    m.setShown=function(){};
    m.stop=function(){};
    m.toFeatureCollection=function(){};
    m.unlisten=function(){};
};
ui.Map.FeatureViewLayer = function(){
    const m = {};
    m.getAssetId=function(){};
    m.getName=function(){};
    m.getOpacity=function(){};
    m.getShown=function(){};
    m.getVisParams=function(){};
    m.setAssetId=function(){};
    m.setName=function(){};
    m.setOpacity=function(){};
    m.setShown=function(){};
    m.setVisParams=function(){};
};
ui.Map.GeometryLayer = function(){
    const m = {};
    m.fromGeometry=function(){};
    m.geometries=function(){};
    m.get=function(key){};
    m.getColor=function(){};
    m.getEeObject=function(){};
    m.getLocked=function(){};
    m.getName=function(){};
    m.getShown=function(){};
    m.openConfigurationDialog=function(){};
    m.set=function(){};
    m.setColor=function(){};
    m.setLocked=function(){};
    m.setName=function(){};
    m.setShown=function(){};
    m.toGeometry=function(){};
};
ui.Map.Layer = function() {
    const m = {};
    m.getEeObject=function(){};
    m.getName=function(){};
    m.getOpacity=function(){};
    m.getShown=function(){};
    m.getVisParams=function(){};
    m.setEeObject=function(){};
    m.setName=function(){};
    m.setOpacity=function(){};
    m.setShown=function(){};
    m.setVisParams=function(){};
};
ui.Map.Linker = function(){
    const m = {};
    m.add=function(){};
    m.forEach=function(){};
    m.get=function(){};
    m.getJsArray=function(){};
    m.insert=function(){};
    m.length=function(){};
    m.remove=function(){};
    m.reset=function(){};
    m.set=function(){};
};

ui.Panel.Layout = {
    absolute:function(){},
    flow:function(){},
};
ui.data = {
    ActiveDictionary:function(){
    return {
        get: function(){},
        set: function(){}
    };
    },
    ActiveList:function(){
    return {
        add:function(){},
        forEach:function(){},
        get:function(){},
        getJsArray:function(){},
        insert:function(){},
        length:function(){},
        remove:function(){},
        reset:function(){},
        set:function(){},
    };

ui.data.ActiveList=function(){
    const m = {};
    m.add=function(){};
    m.forEach=function(){};
    m.get=function(){};
    m.getJsArray=function(){};
    m.insert=function(){};
    m.length=function(){};
    m.remove=function(){};
    m.reset=function(){};
    m.set=function(){};
};
ui.root = {
    add:function(){},
    clear:function(){},
    getLayout:function(){},
    insert:function(){},
    onResize:function(){},
    remove:function(){},
    setKeyHandler:function(){},
    setLayout:function(){},
    widgets:function(){},
}
ui.url = {
    get:function(){},
    set:function(){},
}
ui.util = {
    clear:function(){},
    clearTimeout:function(){},
    debounce:function(){},
    getCurrentPosition:function(){},
    rateLimit:function(){},
    setInterval:function(){},
    setTimeout:function(){},
    throttle:function(){},
}
ui.Key={};

class uiutil{
    constructor(){}
    clear=function(){};
    clearTimeout=function(timeoutKey){};
    debounce=function(func, delay, scope){};
    getCurrentPosition=function(success, error){};
    rateLimit=function(func, delay, scope){};
    setInterval=function(func, delay){};
    setTimeout=function(func, delay){};
    throttle=function(func, delay, scope){};
}
/*
Empty ui Class whose functions expect
the same arguments as in the code editor.
*/
class UIConstructor{
    constructor(){}
    Button = new uiButton();
    Chart = new uiChart();
    Checkbox = new uiCheckbox();
    DateSlider = new uiDateSlider();
    Label = new uiLabel();
    Map = new uiMap();
    Panel = new uiPanel();
    Select = new uiSelect();
    Slider = new uiSlider();
    SplitPanel = new uiSplitPanel();
    Textbox = new uiTextbox();
    Thumbnail = new uiThumbnail();
    root = new uiroot();
    url = new uiurl(); 
    util = new uiutil();
    Key=null;
}
exports.ui = new UIConstructor();

class ChartArrayConstructor{
    constructor(){}
    values=function(array,axis,xLabels){};
}
class ChartFeatureConstructor{
    constructor(){}
    byFeature=function(features,xProperty,yProperties){};
    byProperty=function(features,xProperties,seriesProperty){};
    groups=function(features,xProperty,yProperty,seriesProperty){};
    histogram=function(features,property,maxBuckets,minBucketWidth,maxRaw){};
}
class ChartImageConstructor{
    constructor(){}
    byClass=function(image, classBand, region, reducer, scale, classLabels, xLabels){};
    byRegion=function(image, regions, reducer, scale, xProperty){};
    doySeries=function(imageCollection, region, regionReducer, scale, yearReducer, startDay, endDay){};
    doySeriesByRegion=function(imageCollection, bandName, regions, regionReducer, scale, 
        yearReducer, seriesProperty, startDay, endDay){};
    doySeriesByYear=function(imageCollection, bandName, region, regionReducer, scale, 
        sameDayReducer, startDay, endDay){};
    histogram=function(image, region, scale, maxBuckets, minBucketWidth, maxRaw){};
    regions=function(image, regions, reducer, scale, seriesProperty, xLabels){};
    series=function(imageCollection, region, reducer, scale, xProperty){};
    seriesByRegion=function(imageCollection, regions, reducer, band, scale, xProperty, seriesProperty){};
}
class ChartConstructor{
   /*
   Empty Chart Class whose functions expect
   the same arguments as in the code editor.
   */
  constructor(){}
  array = new ChartArrayConstructor();
  feature = new ChartFeatureConstructor();
  image = new ChartImageConstructor();
  Chart=function(dataTable, chartType, options, view){};
  setChartType=function(chartType){};
  setDataTable=function(dataTable){};
  setOptions=function(options){};
  setSeriesNames=function(seriesNames, seriesIndex){};
  setView=function(view){};
  transform=function(transformer){};
}

exports.Chart = new ChartConstructor();