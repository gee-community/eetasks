/* eslint-disable @typescript-eslint/naming-convention */
/*
  Mock implementation of ui 
  so that it can be silently ignored if encountered
  in user code. Some of this could be implemented
  to work with leaflet. 
*/
export const EEUi = {
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
  } as any,
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
  } as any,
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
  } as any,
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
} as any;

EEUi.Chart.array = {
    values: function(){return EEUi.Chart();},
};
EEUi.Chart.feature = {
  byFeature: function () {return EEUi.Chart();},
  byProperty: function () {return EEUi.Chart();},
  groups: function () {return EEUi.Chart();},
  histogram: function () {return EEUi.Chart();},
};
EEUi.Chart.image = {
  byClass: function () {return EEUi.Chart();},
  byRegion: function () {return EEUi.Chart();},
  doySeries: function () {return EEUi.Chart();},
  doySeriesByRegion: function () {return EEUi.Chart();},
  histogram: function () {return EEUi.Chart();},
  regions: function () {return EEUi.Chart();},
  series: function () {return EEUi.Chart();},
  seriesByRegion: function () {return EEUi.Chart();},
};
EEUi.Map.CloudStorageLayer = function(){
    return {
    getBucket: function(){},
    getMaxZoom:function(){},
    getName:function(){},
    getOpacity:function(){},
    getPath:function(){},
    getShown:function(){},
    getSuffix:function(){},
    setBucket:function(){},
    setMaxZoom:function(){},
    setName:function(){},
    setOpacity:function(){},
    setPath:function(){},
    setShown:function(){},
    setSuffix:function(){},
    };
};
EEUi.Map.DrawingTools = function(){
    return {
    addLayer:function(){},
    clear:function(){},
    draw:function(){},
    edit:function(){},
    get:function(){},
    getDrawModes:function(){},
    getLinked:function(){},
    getMap:function(){},
    getSelected:function(){},
    getShape:function(){},
    getShown:function(){},
    layers:function(){},
    onDraw:function(){},
    onEdit:function(){},
    onErase:function(){},
    onLayerAdd:function(){},
    onLayerConfig:function(){},
    onLayerRemove:function(){},
    onLayerSelect:function(){},
    onSelect:function(){},
    onShapeChange:function(){},
    set:function(){},
    setDrawModes:function(){},
    setLinked:function(){},
    setSelected:function(){},
    setShape:function(){},
    setShown:function(){},
    stop:function(){},
    toFeatureCollection:function(){},
    unlisten:function(){},
    };
};
EEUi.Map.FeatureViewLayer = function(){
    return {
    getAssetId:function(){},
    getName:function(){},
    getOpacity:function(){},
    getShown:function(){},
    getVisParams:function(){},
    setAssetId:function(){},
    setName:function(){},
    setOpacity:function(){},
    setShown:function(){},
    setVisParams:function(){},
    };
};
EEUi.Map.GeometryLayer = function(){
    return {
    fromGeometry:function(){},
    geometries:function(){},
    get:function(){},
    getColor:function(){},
    getEeObject:function(){},
    getLocked:function(){},
    getName:function(){},
    getShown:function(){},
    openConfigurationDialog:function(){},
    set:function(){},
    setColor:function(){},
    setLocked:function(){},
    setName:function(){},
    setShown:function(){},
    toGeometry:function(){},
    };
};
EEUi.Map.Layer = function() {
    return {
    getEeObject:function(){},
    getName:function(){},
    getOpacity:function(){},
    getShown:function(){},
    getVisParams:function(){},
    setEeObject:function(){},
    setName:function(){},
    setOpacity:function(){},
    setShown:function(){},
    setVisParams:function(){},
    };
};
EEUi.Map.Linker = function(){
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
};

EEUi.Panel.Layout = {
    absolute:function(){},
    flow:function(){},
};
EEUi.data = {
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
EEUi.root = {
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
EEUi.url = {
    get:function(){},
    set:function(){},
}
EEUi.util = {
    clear:function(){},
    clearTimeout:function(){},
    debounce:function(){},
    getCurrentPosition:function(){},
    rateLimit:function(){},
    setInterval:function(){},
    setTimeout:function(){},
    throttle:function(){},
}
EEUi.Key={};
