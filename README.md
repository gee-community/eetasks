# Earth Engine Tasks

An extension for monitoring Earth Engine tasks. 

## Features

Use the "EE Tasks: open panel" to open a vscode panel. It will show a table of your EE tasks (ID, description, etc.).

A default maximum number of tasks to request is set to 100, which can be modified in the user options. 

![eetasks-readme](https://raw.githubusercontent.com/lopezvoliver/eetasks/main/eetasks-readme.gif)

## Requirements

`gcloud` should be installed and linked to an earth engine account/

If you can get a token using:

```bash
gcloud auth application-default print-access-token
```

then you can use this extension. 

## Extension Settings


This extension contributes the following settings:

* `EEtasks.maxTasks`: Maximum number of tasks to request from earthengine.

## Known Issues

## Release Notes

### 1.0.0

Initial release. 

---