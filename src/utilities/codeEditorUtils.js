/*
Code editor utilities.
- print: mirrors the functionality of print in the Code Editor. See:
    https://developers.google.com/earth-engine/apidocs/print
- Export: mirrors the structure of Export in the Code Editor, with functions
    named identically as in the code Editor, internally wrapping them from
    ee.batch.Export. 
    ⚠️ In contrast to the code Editor, tasks
    are automatically started with a successCallback/errorCallback. See:
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

- Map, ui, and Chart: empty skeleton classes with functions accepting
the same arguments as in the Code Editor, but doing nothing, i.e., 
any user code calling thee functions is silently ignored. 
*/

/*
Prints one or more arguments to the console
using getInfo if allowed.  
*/
exports.print = function(...args){
    args.forEach((object)=>{
    if(object){
      if (typeof object === "object"){
          if ("getInfo" in object){
          console.log(object.getInfo());
          }else{
          console.log(object);
          }
      }else{
          console.log(object);
      }
    }
    });
};

/* ExportImage: wrapper for ee.batchExport.image.toXXX 
functions, but also starts the tasks automatically.
*/
class ExportImage {
    constructor(ee, successCallback, errCallback){
        this.toDrive = function(...args){
            return ee.batch.Export.image.toDrive(...args)
            .start(successCallback, errCallback);
        };
    }
}


/* ExportTable: wrapper for ee.batchExport.table.toXXX 
functions, but also starts the tasks automatically.
*/
class ExportTable {
    constructor(ee, successCallback, errCallback){
        this.toDrive = function(...args){
            return ee.batch.Export.table.toDrive(...args)
            .start(successCallback, errCallback);
        };
    }
}

class ExportConstructor{
    constructor(ee, successCallback, errCallback){
        this.table = new ExportTable(ee, successCallback, errCallback);
        this.image = new ExportImage(ee, successCallback, errCallback);
    }
}
exports.Export = ExportConstructor;
   

/*
The rest are defined to be ignored:
*/
class MapConstructor{
   /*
   Empty Map Class whose functions expect
   the same arguments as in the code editor.
   */
   constructor(){}
   add=function(item){};
   addLayer=function(eeObject,visParams,name,shown,opacity){};
   centerObject=function(object,zoom,onComplete){};
   clear=function(){};
   drawingTools=function(){};
   getBounds=function(asGeoJSON){};
   getCenter=function(){};
   getScale=function(){};
   getZoom=function(){};
   layers=function(){};
   onChangeBounds=function(callback){};
   onChangeCenter=function(callback){};
   onChangeZoom=function(callback){};
   onClick=function(callback){};
   onIdle=function(callback){};
   onTileLoaded=function(callback){};
   remove=function(item){};
   setCenter=function(lon,lat,zoom){};
   setControlVisibility=function(all,layerList,zoomControl,scaleControl,
    mapTypeControl,fullscreenControl,drawingToolsControl){};
   setGestureHandling=function(option){};
   setZoom=function(zoom){};
   style=function(){};
   unlisten=function(idOrType){};
   widgets=function(){};
   }

exports.Map = new MapConstructor();

class UIConstructor{
    constructor(){}
    // TODO
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Chart=function(dataTable, chartType, options, view){};
  setChartType=function(chartType){};
  setDataTable=function(dataTable){};
  setOptions=function(options){};
  setSeriesNames=function(seriesNames, seriesIndex){};
  setView=function(view){};
  transform=function(transformer){};
}

exports.Chart = new ChartConstructor();
