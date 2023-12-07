# Run GEE scripts from vscode!

## Hello world

Use the `EE Tasks: run GEE script` command to run the GEE script open in the Editor using a user account/project. For example:

![hellogee](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/helloGEE.PNG)


> The `EE Tasks: run GEE script (service account)` is also available to run scripts using a valid private key (JSON file). 

upon picking an available account (and project, if required), the script is started. If successful, the output will open in a channel called "EE Tasks: GEE script runs":

![hellogee-log](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/helloGEE-log.png)

## GEE script definition

For the purpose of this document, a "GEE script" is a `.js` file that is able to run in the [Earth Engine Code Editor](https://developers.google.com/earth-engine/guides/playground). 

> ❗ Not all GEE scripts can be run here. More details will be given below. 

How does the [hello-world](#hello-world) example above work? Evidently, running the same script directly in [node](https://nodejs.org/en/) will not work:

```bash
$ node helloGEE.js 
C:\Users\lopezom\helloGEE.js:1
ee.String("Hello world!")
^

ReferenceError: ee is not defined
```

Internally, the EE Tasks extension wraps your code in a function that handles the initialization of ee, as well as providing *some* of the extra features in the [Earth Engine Code Editor](https://developers.google.com/earth-engine/guides/playground), including [print](https://developers.google.com/earth-engine/apidocs/print) and `Export` (e.g. [Export.table.toDrive](https://developers.google.com/earth-engine/apidocs/export-table-todrive)). See more details of what features are [included](#features) and which ones are [excluded](#excluded-features). 


## Use cases 

Why would I want to run a GEE script in vscode? Short answer: [just because I can](https://i.kym-cdn.com/entries/icons/original/000/040/653/goldblum-quote.jpeg). Kidding aside, the goal here is to provide a quick way for developers to test short, simple code, and to submit Export tasks without leaving vscode. 

> ❗ Use of `EE Tasks: run GEE script` is experimental and recommended for experienced GEE developers only. Not following [GEE coding best practices](https://developers.google.com/earth-engine/guides/best_practices) might crash the Extension Host (e.g. the equivalent of [browser lock](https://developers.google.com/earth-engine/guides/debugging#browser-lock)). A simple "Reload window" should get the extension host running back to normal. 

However, simple client-side errors will be caught:

![hellogee-log](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/helloGEE-syntaxError.png)

> ❗ Always use `.getInfo()` with a callback function, otherwise this will crash the Extension Host. Learn why [here](#getInfo-caveat).

## Not recommended use cases

Outside of the specific use-cases defined above, **it is not recommended to run GEE scripts using the EE Tasks extension**. The [Code Editor](https://code.earthengine.google.com) or [geemap](https://geemap.org) are definitely the right tools for exploratory analyses, debugging, etc. 

## Features 

### `print`

`print` somewhat mirrors the functionality of [print](https://developers.google.com/earth-engine/apidocs/print) in the Code Editor:

>  ⚠️ An important difference is that when objects that have a `getInfo` get printed, the operation is performed asynchronously, so the order is not guaranteed ❗

![ExportTableSuccessFail](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/print.png)

> ⚠️ In windows or MacOS, do not use the `.getInfo` methods directly. [Here's why](#caveat-for-windows-and-macos-users). In Linux, this shouldn't be an issue.  

### `Export`

All `Export` features mirror the functionality from the [Code Editor](https://developers.google.com/earth-engine/guides/debugging#browser-lock) (in fact, they [wrap](https://github.com/gee-community/eetasks/blob/main/src/utilities/codeEditorUtils.js) the `ee.batch.Export*` methods). However, 

> ⚠️ In contrast to the Code Editor, tasks will be automatically submitted.

For example:

![ExportTableSuccessFail](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/ExportTableSuccessAndFail.png)

> ⚠️ Another contrast to the Code Editor can be seen in the example above. In the Code Editor, some parameters such as `assetId`, `bucket`, etc. are prompted from the user after clicking "Run". Here, the task fails to start if they are not provided explicitly.  

We can then use the `EE Tasks: view` command to monitor the task:

![ExportTableTaskCompleted](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/ExportTableTaskCompleted.png)

We can see that the task completed, demonstrating task submission *and* monitoring from vscode!

## Excluded features

### `Map`, `Chart`, and `ui` 

These are not supported here. However, lines of code using these features are silently ignored, so there is no need to exclude them:

![silentlyIgnored](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/silentlyIgnored.png)

Support for `Chart` and `Map` *may* be developed in the future. 

### [require](https://developers.google.com/earth-engine/apicods/require)

Importing a module directly from GEE (e.g. `require("users/homeFolder/repo:path/to/file)`) is not currently supported, and is unlikely to be developed soon. However, in some very *limited and specific* cases, one workaround is to (1) clone the git repository ([see how to here](https://gis.stackexchange.com/a/315134/67301)), and (2) change the line of code to use the absolute path to the local file instead. For example:

![require](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/require.png)

This silly example demonstrates the use of require with a local file. However, note that the `clonedGEErepo/test.js` file does not have access to `ee`, `print`, `Export`, etc.. so the script will fail if it attempts to access them. 

The example above works because the function `addOne` does not use any of these, but it does allow using the methods within the objects passed as arguments (e.g. the `.add` method from the passed argument `ee.Number(1)`). A workaround would be to modify the functions to use within the module to require so that they allow passing `ee` (or other features to use) as arguments. 

However.. if you are using `require` you are probably already doing something more complicated than the [recommended use cases](#use-cases) for `EE Tasks: run GEE script`. 

## getInfo caveat

Internally, the [earthengine api](https://github.com/google/earthengine-api) uses the [xmlhttprequest](https://github.com/driverdan/node-XMLHttpRequest) library for the `.getInfo()` method. The default `xmlhttprequest` process is [asynchronous](https://nodejs.org/en/learn/asynchronous-work/javascript-asynchronous-programming-and-callbacks), but it also supports simulating a synchronous request by [spawning a separate node process](https://github.com/driverdan/node-XMLHttpRequest/blob/97966e4ca1c9f2cc5574d8775cbdacebfec75455/lib/XMLHttpRequest.js#L483-L507) which actually does the request and then waiting for it. Using `.getInfo()` *without a callback function* will create a synchronous `xmlhttprequest`. The process spawned for the synchronous `xmlhttprequest` is spawned using the first element of the [array of command line arguments passed when the Node.js process was launched](https://nodejs.org/docs/latest/api/process.html#processargv). This is not a problem when running a script directly in Node. 

Unfortunately, within a vscode extension the value of `process.argv[0]` depends on how vscode was launched. Under normal conditions, this will be the `code` executable (e.g., `C:\Users\username\AppData\Local\Programs\Microsoft VS Code\Code.exe` in Windows), thus spawning the process will fail and ***the Extension Host will crash*** because it will wait undefinitely for the (failed) process to finish (see more details [here](https://stackoverflow.com/a/77618205/3828592)). When running vscode through a remote server (e.g. SSH or WSL), `process.argv[0]` is actually a `node` executable (e.g., `~/.vscode-server/bin/<randomString>/node`) and the `xmlhttprequest` process works as expected. 

Anyway, the best practice is to not use `.getInfo()` at all, or to use it with a callback function if it is absolutely needed. For some ee objects, you can also use evaluate (see a good example for `projection.evaluate()` [here](https://gis.stackexchange.com/a/443194/67301)). 
