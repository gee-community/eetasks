# Change Log

## v0.0.1

- Initial release
    - Provides the "EE Tasks: view" commands (interactive, default, or service account) for a default view of EE tasks:

        | Id | Type | Description | State | CreateTime | EndTime | BatchEECU |  
        | --- | --- | --- | --- | --- | --- | --- |  

    - Provides "EE Tasks: update gcloud accounts list". Only required after using `gcloud` to authenticate additional users. This is done automatically the first time the extension is activated (if `gcloud` is available). 

## v0.1.0

- Major internal changes to improve performance
- New feature: run a GEE script from vscode! see documentation [here](https://github.com/gee-community/eetasks/blob/main/docs/runGEEscripts.md)
- Fixed a [bug](https://github.com/gee-community/eetasks/issues/1) that prevented the EndTime and BatchEECU columns to display. 
- Renamed the `EE Tasks: update gcloud accounts list` command to `EE Tasks: update available accounts`. This reflects an implementation change that simplifies and groups all accounts (gcloud and "earthengine").  

## v0.1.1

- Bug fix [issue #3](https://github.com/gee-community/eetasks/issues/3) 

## v0.1.2

- Bug fix [issue #5](https://github.com/gee-community/eetasks/issues/5) 
- Internal improvements to `Export.image.to*`
- Completed the skeleton for `ui` and `Chart` so they can be silently ignored in `EE Tasks: run GEE scripts`.
