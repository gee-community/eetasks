/* eslint-disable @typescript-eslint/naming-convention */
/*
  Mock implementation of Chart (deprecated)
  so that it can be silently ignored if encountered
  in user code. 
*/
export const EEChart = function(){
    return {
        setChartType:function(){},
        setDataTable:function(){},
        setOptions:function(){},
        setSeriesNames:function(){},
        setView:function(){},
        transform:function(){},
    };
};
EEChart.array = {
    values: function(){return EEChart();},
};
EEChart.feature = {
    byFeature: function(){return EEChart();},
    byProperty: function(){return EEChart();},
    groups: function(){return EEChart();},
    histogram: function(){return EEChart();},
};
EEChart.image = {
    byClass: function(){return EEChart();},
    byRegion: function(){return EEChart();},
    doySeries: function(){return EEChart();},
    doySeriesByRegion: function(){return EEChart();},
    histogram: function(){return EEChart();},
    regions: function(){return EEChart();},
    series: function(){return EEChart();},
    seriesByRegion: function(){return EEChart();},
};
