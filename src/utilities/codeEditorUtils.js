/* eslint-disable @typescript-eslint/naming-convention */
/*
Code editor utilities.
*/
const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawnSync } = require('child_process');

function tryGitCommand(repoPath, gitCommand) {
    try {
        const result = spawnSync('git', [gitCommand], 
            {cwd: repoPath, stdio: 'inherit',windowsHide: true});
        if (result.error) {
            throw result.error;
        }
        if (result.status !== 0) {
            throw new Error(`git ${gitCommand} exited with code ${result.status}`);
        } 
    } catch (error) {
        console.log('Warning: error executing git ', gitCommand, ' :', error.message);
    }
}

function tryGitClone(eeRepository, repoPath){
    const gitRepository = `https://earthengine.googlesource.com/${eeRepository}`;
    const gitNewPasswordUrl = "https://earthengine.googlesource.com/new-password";
    const result = spawnSync('git', ['clone', gitRepository, repoPath],
        {stdio: ['inherit', 'inherit', 'pipe'], windowsHide: true}
    );
    if (result.status !== 0) {
        const errorMessage = result.stderr.toString();
        if(errorMessage.includes('Invalid authentication credentials')){
            throw new Error(`Error accessing EE repositories. 
                Visit ${gitNewPasswordUrl} to configure Git access to EE repositories in your machine.`);
        }
        if(errorMessage.includes('not found')){
            throw new Error(`\n EE repository not found:\n ${eeRepository}`);
        }
        if(errorMessage.includes('The caller does not have permission')){
            console.log(result);
            console.log(errorMessage);
            throw new Error(`Permission denied to EE repository ${eeRepository}.`);
        }
        // Other errors:
        throw new Error(`${result.stderr.toString()}`);
    } 
}

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

 class MapConstructor{
    constructor(ee, panel, uri){
        this.ee = ee;
        this._panel = undefined;
        this._openMapPanelIfNeeded = function(){
        if (typeof this._vsMapPanel === 'undefined'){
            this._vsMapPanel = panel.render(uri);
        }
        };
        this.setCenter=function(lon,lat,zoom){
            this._openMapPanelIfNeeded();
            const coord = [lat, lon];
            this._vsMapPanel.setView(coord, zoom);
        };
        this.addLayer=function(eeObject,visParams,name,shown,opacity){
            this._openMapPanelIfNeeded();
            let ee = this.ee;
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
        // NOT YET IMPLEMENTED:
        this.add=function(item){};
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
};

class Tools {
    constructor(ee, vsLog, vsMap, vsUri, successCallback, errCallback, fileName) {
        this.fileName = fileName;
        this.filePath = path.dirname(fileName);
        this.ee = ee;
        this.log = this.Log(vsLog);
        this.print = this.Print(this.log);
        this.Map = new MapConstructor(ee, vsMap, vsUri);
        this.Export = new ExportConstructor(ee, successCallback, errCallback);

        /* These are defined to be silently ignored*/
        this.ui = ui;
        this.Chart = Chart;
    }

    Log = function(log){
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
    Print(log){
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

    Require() {
        return (eeScriptPath) => {
            /*
            This function acts like `require` but also provides `ee` and the code editor tools
            (print, Map, Export, etc.. including this `require` function itself)
            to the "required" module.

            The module could be a local script or a reference to a script within
            a EE repository.

            We first check if `eeScriptPath` is already a direct path. 
            */
            let m;
            let modulePath;
            let moduleCode;
            const localPath = path.join(os.homedir(), ".eetasks-user-modules");
            
            if((eeScriptPath===undefined) | (eeScriptPath==="")){
                throw new Error(`require expects a path to a EE script or local file`);
            }

            // First check if this is already a path to a file to require:
            m = fs.statSync(path.normalize(eeScriptPath), { throwIfNoEntry: false });
            modulePath = path.normalize(eeScriptPath);

            if(m===undefined){
            /*  Now check if this is a relative path to a file to require, 
                relative to the location of the file where the `run GEE script`
                command was issued. 
            */
            modulePath = path.join(this.filePath, path.normalize(eeScriptPath));
            m = fs.statSync(modulePath, { throwIfNoEntry: false});
            }           

            if(m===undefined){
            /* 
              Couldn't find the file. It might be a path to a script in a
              google repository:
              earthengine.googlesource.com/pathToRepository:pathToScript
                                           -----------------------------
                                                     eeScriptPath
            */
                const eeScriptPathSplit = eeScriptPath.split(":");
                const eeRepository = eeScriptPathSplit[0];
                const eeScript = eeScriptPathSplit[1];
                if(eeScript===undefined){
                    throw new Error(`Could not find module to require: ${eeScriptPath}`);
                }

                let repoLocalPath = path.join(localPath, path.normalize(eeRepository) );

                if (fs.existsSync(repoLocalPath)) {
                    /*  
                    We might have already cloned the repository to:
                          ~/.eetasks-user-modules/pathToRepository
                    Let's try to git pull to get the most recent version.

                    note: this could be improved to improve performance
                    instead of doing this every time.. perhaps using a 
                    user-configured option.. 
                    */
                    tryGitCommand(repoLocalPath, 'pull');
                }else{
                    /* The repository does not exist yet, so let's try
                    to retrieve it. This might raise an error if the user
                    hasn't configured Git using                    
                    https://earthengine.googlesource.com/new-password

                    Try to do git clone, raising an error if this fails.
                    */
                   if(!fs.existsSync(localPath)){
                    fs.mkdirSync(localPath);
                   }
                   tryGitClone(eeRepository, repoLocalPath); // TODO raise proper git error
                }

                modulePath = path.join(repoLocalPath, path.normalize(eeScript));

                // If it doesn't exist here, then throw custom error:
                m = fs.statSync(modulePath, { throwIfNoEntry: false });
                if(m===undefined){
                    throw new Error(`require: Could not find the script \n \`${eeScript}\` \n inside the EE repository ${eeRepository}.`);
                } 
            }

            // Load the contents of the script as text: 
            moduleCode = fs.readFileSync(modulePath);

            const moduleExports = {};
            const moduleContext = {
                exports: moduleExports,
                ee: this.ee,
                require: this.Require(),
                print: this.print,
                Map: this.Map,
                Export: this.Export,
                ui: this.ui,
                Chart: this.Chart
            };

            const moduleFunction = new Function(
                "exports", 
                "ee", 
                "require", 
                "print", 
                "Map",
                "Export",
                "ui",
                "Chart",
                moduleCode);
            moduleFunction(moduleContext.exports, 
                moduleContext.ee, 
                moduleContext.require,
                moduleContext.print, 
                moduleContext.Map, 
                moduleContext.Export, 
                moduleContext.ui, 
                moduleContext.Chart, 
            );
            return moduleContext.exports;
        };
    }
}
exports.Tools = Tools;

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
    },  
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

/*
    Mock implementation of Chart
    Note that Chart is now deprecated
    (we could take it from the ui.Chart.. )
*/
const Chart = function(){
    return {
        setChartType:function(){},
        setDataTable:function(){},
        setOptions:function(){},
        setSeriesNames:function(){},
        setView:function(){},
        transform:function(){},
    };
};
Chart.array = {
    values: function(){return Chart();},
};
Chart.feature = {
    byFeature: function(){return Chart();},
    byProperty: function(){return Chart();},
    groups: function(){return Chart();},
    histogram: function(){return Chart();},
};
Chart.image = {
    byClass: function(){return Chart();},
    byRegion: function(){return Chart();},
    doySeries: function(){return Chart();},
    doySeriesByRegion: function(){return Chart();},
    histogram: function(){return Chart();},
    regions: function(){return Chart();},
    series: function(){return Chart();},
    seriesByRegion: function(){return Chart();},
};
