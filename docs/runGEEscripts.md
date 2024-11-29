# Run GEE scripts from vscode!

## Hello world

Use the `EE Tasks: run GEE script` command to run the GEE script open in the Editor using a user account/project. For example:

![hellogee](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/helloGEE.PNG)


> The `EE Tasks: run GEE script (service account)` is also available to run scripts using a valid private key (JSON file). 

upon picking an available account (and project, if required), the script is started. If successful, the output will open in a channel called "EE Tasks: GEE script runs":

![hellogee-log](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/helloGEE-log.png)

## GEE script definition

For the purpose of this document, a "GEE script" is a `.js` file that is able to run in the [Earth Engine Code Editor](https://developers.google.com/earth-engine/guides/playground). 

> ❗ Not all GEE scripts can be run here. 

The EE Tasks extension wraps your code in a function that handles the initialization of `ee`, as well as providing *some* of the extra features in the [Earth Engine Code Editor](https://developers.google.com/earth-engine/guides/playground), including [print](https://developers.google.com/earth-engine/apidocs/print), `Export` (e.g. [Export.table.toDrive](https://developers.google.com/earth-engine/apidocs/export-table-todrive)), and [Map.addLayer](https://developers.google.com/earth-engine/apidocs/map-addlayer). Here's a [list](#features) of what is available.  


## Submit tasks directly from vscode

If your script uses any of the supported `Export` commands, your tasks will be submitted automatically and you can monitor the tasks using the `EE Tasks: view tasks` command. 

The following animation shows an example that submits a single `Export.image.toDrive` task. A notification then informs the user that the task was submitted successfully. Then, the task can be monitored with the `EE Tasks: view tasks` command. 

![eetasks-readme](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/geerunExample.gif)

## Show EE layers in an interacive map

The animation above also shows the capability of adding EE layers to an interactive map, which supports `ee.Image`, `ee.ImageCollection`, `ee.Geometry`, `ee.Feature`, and `ee.FeatureCollection`. 

## Client-side errors

Client-side errors (errors in your script not related to EE) will be shown in an error notification:

![hellogee-log](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/helloGEE-syntaxError.png)


## Features 

### `print`

`print` somewhat mirrors the functionality of [print](https://developers.google.com/earth-engine/apidocs/print) in the Code Editor:

>  ⚠️ Print for eeObjects wraps `getInfo` in asynchronous mode, so the order appearing in the output is not guaranteed❗. Use `print(myEeObject.getInfo())` if you want the script to perform the print synchronously. 

![ExportTableSuccessFail](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/print.png)

### `Export`

All `Export` features mirror the functionality from the [Code Editor](https://developers.google.com/earth-engine/guides/debugging#browser-lock) (in fact, they [wrap](https://github.com/gee-community/eetasks/blob/main/src/utilities/codeEditorUtils.js) the `ee.batch.Export*` methods). However, 

> ⚠️ In contrast to the Code Editor, tasks will be automatically submitted.

For example:

![ExportTableSuccessFail](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/ExportTableSuccessAndFail.png)

> ⚠️ Another contrast to the Code Editor can be seen in the example above. In the Code Editor, some parameters such as `assetId`, `bucket`, etc. are prompted from the user after clicking "Run". Here, the task fails to start if they are not provided explicitly.  

We can then use the `EE Tasks: view` command to monitor the task:

![ExportTableTaskCompleted](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/ExportTableTaskCompleted.png)

We can see that the task completed, demonstrating task submission *and* monitoring from vscode!

### Map

Currently, only [Map.setCenter](https://developers.google.com/earth-engine/apidocs/map-setcenter) and [Map.addLayer](https://developers.google.com/earth-engine/apidocs/map-addlayer) have been implemented. If your script uses any of these two commands, a [leaflet](https://leafletjs.com/) map will open, and if your script uses `Map.addLayer`, the layers should be added to the map. The Map features a simple control for the opacity (slider) and visibility (checkbox) of each layer.

![ExportTableTaskCompleted](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/map.png)

Any other `Map` commands will be silently ignored

### Excluded

Any other extra features that the Code Editor provides, such as [ui.Chart](https://developers.google.com/earth-engine/apidocs/ui-chart) (or other `ui` features) are not yet implemented, but will be silently ignored. 

