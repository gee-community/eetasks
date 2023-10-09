# Earth Engine Tasks

An extension for monitoring Earth Engine tasks. 

## Features

![eetasks-readme](https://raw.githubusercontent.com/lopezvoliver/eetasks/main/eetasks-readme.gif)

Open a table view of Earth Engine tasks for a user or service account. 

## Requirements

A [Google Earth Engine account](https://code.earthengine.google.com/register) is required to use the Earth Engine Tasks Manager extension. Additionally, either the [Earth Engine command line tool](https://developers.google.com/earth-engine/guides/command_line) (eecli) or the Earth Engine [python client library](https://developers.google.com/earth-engine/guides/python_install) must have been used to authenticate an account. If you are familiar with the [gcloud cli](https://cloud.google.com/sdk/docs/install) and have already [authenticated](https://cloud.google.com/sdk/gcloud/reference/auth/login) an earth engine account, you can also use `gcloud` to authenticate the Earth Engine library for this extension. 

### Multi-account views

![eetasks-multi](https://raw.githubusercontent.com/lopezvoliver/eetasks/main/eetasks-multi.png)

Multiple panels may be opened to view the tasks for different users.


#### Interactive account selection

![eetasks-users](https://raw.githubusercontent.com/lopezvoliver/eetasks/main/eetasks-users.png)

Use the `EE Tasks: view tasks` command to interactively select a user account. 

The `earthengine` account refers to the credentials stored and managed by the earthengine Python API. The EE tasks extensions will never modify these credentials. 

The other accounts shown (if any) are managed by the `gcloud cli` (as well as the earthengine cli through `gcloud`). You can use `gcloud auth login` to add an additional user, and `gcloud auth list` to display the accounts. The first time the EE tasks extension is activated, it will look for these accounts. If you have updated the credentialed accounts with `gcloud`, update them in the extension by using the `EE tasks: update gcloud accounts list`.

When selecting an account other than `earthengine`, you will also be prompted to specify a project to use. 

#### Default account

![eetasks-default](https://raw.githubusercontent.com/lopezvoliver/eetasks/main/eetasks-default.png)

You may also specify a default account and project to use with the `EE tasks: view tasks (defaut account)`. Set the default account to `earthengine` to use the credentials managed by the eecli or python library, in which case there is no need to specify a project. You may also specify `application-default` to use the [application default credentials](https://cloud.google.com/sdk/gcloud/reference/auth/application-default). If the project is left blank and the account is not `earthengine`, you will be prompted for it. If the account is blank, you will prompted for it. Specifying an account that is not any of `earthengine`, `application-default`, or in the `gcloud auth list` will result in an error. 

#### Service account (advanced use)

Use the `EE tasks: view tasks (service account)` to view the tasks associated to a [service account](https://developers.google.com/earth-engine/guides/service_account). You wil be prompted to select a `json` file ([see the animation](#features) above).


## Extension Settings

This extension contributes the following settings:

* `eetasks.limit`: Maximum number of tasks to request from earthengine. This value is set by default to null (blank), which means that there is no limit to the number of tasks to retrieve. 

* `eetasks.defaultProject`: The default earthengine project to use with the `EE Tasks: view tasks (default account)` command.

* `eetasks.defaultAccount`: The default earthengine account to use with the `EE Tasks: view tasks (default account)` command.


## Known Issues

- Currently only tested in linux ⚠️. 
- The tasks tables do not refresh automatically. However, you can use the refresh button (🔄) to update the table on demand. 
- The gcloud accounts lists is retrieved automatically only the first time the extension is activated. However, you can use the `EE tasks: update gcloud accounts list` to update it. 


## Release Notes

### 1.0.0

Initial release. Includes the tasks view commands (interactive, default, or service account).

---