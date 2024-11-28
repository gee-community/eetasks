# Change Log

## v0.3.0

- *New Feature*: ability to open a leaflet.js Map, which supports Map.addLayer
- Internal changes to promptProject

## v0.2.2

- Added "FAILED" tasks count to tasks information label.

## v0.2.1 

- Added a label to the Tasks panel displaying aggregated information about the tasks (total number of tasks and by State -- completed, running, etc.).

## v0.2.0

- New authentication method: sign-in (or out) of an account directly through the extension.
- Breaking changes: selecting a default account/project moved: Instead of being a configuration option, you can now interatively select a default account/project to use (`EE Tasks: set default account`).
- Major [internal changes](https://github.com/lopezvoliver/eetasks/commit/2207a5331388bb69831bd15d54d8b38fa07cacad#comments) to accommodate signed in accounts.

## v0.1.2

- Bug fix [issue #5](https://github.com/gee-community/eetasks/issues/5) 
- Internal improvements to `Export.image.to*`
- Completed the skeleton for `ui` and `Chart` so they can be silently ignored in `EE Tasks: run GEE scripts`.

## v0.1.1

- Bug fix [issue #3](https://github.com/gee-community/eetasks/issues/3) 


## v0.1.0

- Major internal changes to improve performance
- New feature: run a GEE script from vscode! see documentation [here](https://github.com/gee-community/eetasks/blob/main/docs/runGEEscripts.md)
- Fixed a [bug](https://github.com/gee-community/eetasks/issues/1) that prevented the EndTime and BatchEECU columns to display. 
- Renamed the `EE Tasks: update gcloud accounts list` command to `EE Tasks: update available accounts`. This reflects an implementation change that simplifies and groups all accounts (gcloud and "earthengine").  


## v0.0.1

- Initial release
    - Provides the "EE Tasks: view" commands (interactive, default, or service account) for a default view of EE tasks:

        | Id | Type | Description | State | CreateTime | EndTime | BatchEECU |  
        | --- | --- | --- | --- | --- | --- | --- |  

    - Provides "EE Tasks: update gcloud accounts list". Only required after using `gcloud` to authenticate additional users. This is done automatically the first time the extension is activated (if `gcloud` is available). 
