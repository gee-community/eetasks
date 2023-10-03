# Earth Engine Tasks

An extension for monitoring Earth Engine tasks. 

## Features

Use the "EE Tasks: open panel" to open a vscode panel. It will show a table of your EE tasks (ID, description, etc.).

A default maximum number of tasks to request is set to 100, which can be modified in the user options. 

![eetasks-readme](https://raw.githubusercontent.com/lopezvoliver/eetasks/main/eetasks-readme.gif)

## Requirements

This extension does not offer a method to authenticate earth engine. Instead, it relies on the user having the [earthengine](https://developers.google.com/earth-engine/guides/command_line) utility installed and [already authenticated](https://developers.google.com/earth-engine/guides/command_line#authenticate).  

## Extension Settings


This extension contributes the following settings:

* `eetasks.limit`: Maximum number of tasks to request from earthengine. This value is set by default to null, which means that there is no limit to the number of tasks to retrieve. 

## Known Issues

## Release Notes

### 1.0.0

Initial release. 

---