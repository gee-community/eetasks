# Earth Engine Tasks

An extension for monitoring Earth Engine tasks. 

## Features

### EE Tasks: view tasks

![eetasks-readme](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/eetasks-readme.gif)

Open a table view of Earth Engine tasks for a user or service account. 

### EE Tasks: run GEE script

![eetasks-readme](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/geerunExample.gif)

Run GEE code from within vscode! Learn more about what is [currently supported here](https://github.com/gee-community/eetasks/blob/main/docs/runGEEscripts.md). 


## Requirements

A [Google Earth Engine account](https://code.earthengine.google.com/register) is required to use the Earth Engine Tasks Manager extension. 

### Sign in options

Use the `EE Tasks: sign in` command to add an account to use with the EE Tasks extension.  

You might already have an account ready to use with the extension (no sign-in required) if you are a user of the Earth Engine [python client library](https://developers.google.com/earth-engine/guides/python_install) or the [Earth Engine command line tool](https://developers.google.com/earth-engine/guides/command_line) (eecli). Use the `EE Tasks: update available accounts` to make these accounts available to the extension. This command will run automatically upon first use of either the [view tasks](#ee-tasks-view) or [run gee script](#ee-tasks-run-gee-script) commands, if there are no signed-in accounts yet. 

## Multi-account views

![eetasks-multi](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/eetasks-multi.png)

Multiple panels may be opened to view the tasks for different accounts. 

### Interactive account selection

![eetasks-users](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/eetasks-users.png)

If there are at least two accounts available to the extension, you will be prompted to select an account when using either the `EE Tasks: view tasks` or `EE Tasks: run GEE script`. 

Accounts signed-in through the extension (`EE Tasks: sign in`) show with a 👤 icon next to them. 

> You can remove a signed-in account with `EE Tasks: sign out`. 

Other available accounts are updated with the `EE Tasks: update available accounts`. 

The 🐍 `earthengine` account refers to the credentials stored and managed by the earthengine Python API. The EE Tasks extension will not modify these credentials. 

You might also have [gcloud](https://cloud.google.com/sdk/docs/install) installed if you use the [Earth Engine command line tool](https://developers.google.com/earth-engine/guides/command_line) (the python API client also uses `gcloud` in some environments). The `application-default` account refers to the
[application default credentials](https://cloud.google.com/sdk/gcloud/reference/auth/application-default) used by gcloud.

Other `gcloud` accounts shown (if any) are accounts that have been authenticated using `gcloud auth login` (you can use `gcloud auth list` to display these accounts). If the account has already been signed-in through the extension, it will not be repeated under `gcloud`. 

When using the `EE tasks: run GEE script` command, you will also be prompted for a [project](https://developers.google.com/earth-engine/cloud/projects). 

#### Default account

The `EE Tasks: view tasks (default account)` can be used to open a tasks panel view without having to select the account. You can set the default account to use with the `EE Tasks: set default account`. This is only useful if there is more than one account available to the extension.

#### Service account (advanced use)

Use the `EE Tasks: view tasks (service account)` to view the tasks associated to a [service account](https://developers.google.com/earth-engine/guides/service_account). You wil be prompted to select a `json` file ([see the animation](#features) above).

There is also a variation of the [EE Tasks: run GEE script](#ee-tasks-run-gee-script) command to use a service account instead of a user account. 

## Extension Settings

This extension contributes the following settings:

* `eetasks.limit`: Maximum number of tasks to request from earthengine. This value is set by default to null (blank), which means that there is no limit to the number of tasks to retrieve. 

## Known Issues

- The tasks tables do not refresh automatically. However, you can use the refresh button (🔄) to update the table on demand. 
- The intended use for the `EE Tasks: run GEE script` is limited and currently experimental (recommended for experienced users only). [Learn more about it here](https://github.com/gee-community/eetasks/blob/main/docs/runGEEscripts.md).
    - An unknown cause for an issue prevents the use of synchronous calls to some `ee` functions in Windows. Learn more about it [here](https://github.com/gee-community/eetasks/blob/main/docs/runGEEscripts.md#caveat-for-windows-users)