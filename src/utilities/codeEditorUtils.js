/*
Code editor aliases.
print and Export* mirror the functionality in the code editor;
Map, Chart, and ui are ignored (empty skeleton classes)

*with the big caveat that tasks will be automatically submitted.
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

// eslint-disable-next-line @typescript-eslint/naming-convention
exports.ExportMod = function(Export, errCallback){
    /*
    TODO: modify the Export class
    so that tasks are automatically started.
    This is a different behavior than the codeEditor,
    where tasks are added to a queue and the user
    needs to manually click each one.
    This would be difficult to mirror here, and 
    it would be actually more convenient for 
    a user to start them automatically. 
    This will need to be specified in the documentation.
    */
    //TODO: modify the Export class
    // so that it starts the tasks 
    // automatically
    // For success callback, use a dummy function
    // for error callback, alert the user.
    //Export.table.toDriveOriginal = Export.table.toDrive; 
    //Export.table.toDrive = function(...args){
    //    return Export.table.toDriveOriginal(...args)
    //    .start(()=>{}, errCallback);
    //};
    return Export;
};

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
