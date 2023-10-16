# Change Log

## v0.0.1

- Initial release
    - Provides the "EE Tasks: view" commands (interactive, default, or service account) for a default view of EE tasks:

        | Id | Type | Description | State | CreateTime | EndTime | BatchEECU |  
        | --- | --- | --- | --- | --- | --- | --- |  

    - Provides "EE Tasks: update gcloud accounts list". Only required after using `gcloud` to authenticate additional users. This is done automatically the first time the extension is activated (if `gcloud` is available). 