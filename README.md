# Earth Engine Tasks

An extension for monitoring Earth Engine tasks. 

## Features

### EE Tasks: view tasks

![eetasks-readme](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/eetasks-readme.gif)

Open a table view of Earth Engine tasks for a user or service account. 

### EE Tasks: run GEE script

![eetasks-readme](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/geerunExample.gif)

Run GEE code from within vscode! Learn more about what is [currently supported here](https://github.com/gee-community/eetasks/blob/main/docs/runGEEscripts.md). 

### EE Tasks: update available accounts

Use this command if you expect to use this extension for [multiple accounts](#multi-account-views). The command is run automatically upon first use of either the [view tasks](#ee-tasks-view) or [run gee script](#ee-tasks-run-gee-script) commands. 

## Requirements

A [Google Earth Engine account](https://code.earthengine.google.com/register) is required to use the Earth Engine Tasks Manager extension. Additionally, either the [Earth Engine command line tool](https://developers.google.com/earth-engine/guides/command_line) (eecli) or the Earth Engine [python client library](https://developers.google.com/earth-engine/guides/python_install) must have been used to authenticate an account. If you are familiar with the [gcloud cli](https://cloud.google.com/sdk/docs/install) and have already [authenticated](https://cloud.google.com/sdk/gcloud/reference/auth/login) an earth engine account, you can also use `gcloud` to authenticate the Earth Engine library for this extension. 

### Multi-account views

![eetasks-multi](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/eetasks-multi.png)

Multiple panels may be opened to view the tasks for different accounts. 

#### Interactive account selection

The available user accounts are populated using the [EE Tasks: update available accounts](#ee-tasks-update-available-accounts) command at any time. This command is automatically called upon the first time you run either the [EE Tasks: view tasks](#ee-tasks-view-tasks) or the [EE Tasks: run GEE script](#ee-tasks-run-gee-script) commads.

![eetasks-users](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/eetasks-users.png)

The `earthengine` account refers to the credentials stored and managed by the earthengine Python API. The EE Tasks extension will not modify these credentials. 

The `application-default` account refers to the
[application default credentials](https://cloud.google.com/sdk/gcloud/reference/auth/application-default) in `gcloud`.

The other accounts shown (if any) are managed by the `gcloud cli` (as well as the earthengine cli through `gcloud`). You can use `gcloud auth login` to add an additional user, and `gcloud auth list` to display the accounts. If you update the credentialed accounts with `gcloud`, update them in the extension by using the [EE Tasks: update available accounts](#ee-tasks-update-available-accounts). 

When selecting an account other than `earthengine`, you will also be prompted to specify a project to use. 

#### Default account

![eetasks-default](https://raw.githubusercontent.com/gee-community/eetasks/main/docs/assets/eetasks-default.png)

You may also specify a default account and project to use with the `EE tasks: view tasks (default account)`. You may specify any of the available accounts. 

If the project is left blank and the account is not `earthengine`, you will be prompted for it. If the account is blank, you will prompted for it. Specifying an account that is not any of the available accounts will not work. 

#### Service account (advanced use)

Use the `EE Tasks: view tasks (service account)` to view the tasks associated to a [service account](https://developers.google.com/earth-engine/guides/service_account). You wil be prompted to select a `json` file ([see the animation](#features) above).

There is also a variation of the [EE Tasks: run GEE script](#ee-tasks-run-gee-script) command to use a service account instead of a user account. 

## Extension Settings

This extension contributes the following settings:

* `eetasks.limit`: Maximum number of tasks to request from earthengine. This value is set by default to null (blank), which means that there is no limit to the number of tasks to retrieve. 

* `eetasks.defaultProject`: The default earthengine project to use with the `EE Tasks: view tasks (default account)` command.

* `eetasks.defaultAccount`: The default earthengine account to use with the `EE Tasks: view tasks (default account)` command.


## Known Issues

- The tasks tables do not refresh automatically. However, you can use the refresh button (🔄) to update the table on demand. 
- The intended use for the `EE Tasks: run GEE script` is limited and currently experimental (recommended for experienced users only). [Learn more about it here](https://github.com/gee-community/eetasks/blob/main/docs/runGEEscripts.md).
    - An unknown cause for an issue prevents the use of synchronous calls to some `ee` functions in Windows. Learn more about it [here](https://github.com/gee-community/eetasks/blob/main/docs/runGEEscripts.md#caveat-for-windows-users)