# OpenShift Heartbeat Monitor Generator

A tool to dynamically generate configuration files to be used with [Heartbeat](https://www.elastic.co/beats/heartbeat) to monitor OpenShift routes.

## Installation

```
$  npm i -g openshift-hearbeat-monitor-generator
```

## Usage

First, you need to add a label to your route. The default label name is "uptime-monitor" and will take the monitoring interval as a value (values can be in **h**ours, **m**inutes or **s**econds), for example:

```
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  labels:
    app: my-app
    uptime-monitor: 1h
  name: my-public-route
spec:
  host: my-app.com
  tls:
...
```

And then you'll need to execute the `generate-monitor` subcommand with your cluster URL and access token.

```
$ openshift-hearbeat-monitor-generator generate-monitor \
  --cluster-url https://url-to-your-openshift-cluster:8443 \
  --token 'your-access-token'
```

The routes containing the label will be scanned in your cluster and the output (stdout) will be something like this:

```
- type: http
  name: my-public-route
  urls: ["https://my-app.com"]
  schedule: "@every 1h"
```

You can easily use bash redirection (or by piping with `tee`) to write this configuration into a file that will be read by the Heartbeat daemon (e.g., `/etc/heartbeat/conf.d/openshift-routes.yml`).

### Status Code

Some routes will not return a 200 HTTP status code while still indicating that the application is online. Although Heartbeat is not a tool to perform healthchecks in your applications, you can use the label "uptime-status-code" to get around this.

**Note:** You can override the names of the labels with the enviroment variables `MONITOR_LABEL` and `MONITOR_STATUS_CODE_LABEL`.
