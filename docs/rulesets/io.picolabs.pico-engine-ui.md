# io.picolabs.pico-engine-ui

This is the only ruleset the pico-engine-ui.js needs to operate

*Version 0.0.0. Generated from the ruleset's annotations by `krl-schema --format markdown`; edit the `/** */` comments in the source, not this page. Only annotated rules and shared functions appear.*

**Queries:** [box](#box--map) · [uiECI](#uieci--string) · [pico](#pico--map) · [logs](#logs--array) · [testingECI](#testingeci--string) · [testingHistory](#testinghistoryrid--map) · [testingSaved](#testingsavedrid--map) · [name](#name--string)

## Queries

### `box()` → Map

How the developer UI draws this pico: name, color, position, size, and the UI channels of its parent and children.

**Call:** `GET /sky/query/<eci>/io.picolabs.pico-engine-ui/box`, or `<alias>:box()` from KRL with `use module io.picolabs.pico-engine-ui alias <alias>`

### `uiECI()` → String

The ECI of this pico's UI channel (tagged engine,ui), used by the developer UI to send engine_ui events and queries to this pico.

**Call:** `GET /sky/query/<eci>/io.picolabs.pico-engine-ui/uiECI`, or `<alias>:uiECI()` from KRL with `use module io.picolabs.pico-engine-ui alias <alias>`

### `pico()` → Map

This pico's channels (with their policies) and installed rulesets, plus the UI channels of its parent and children. A quick way to see what a pico is.

**Call:** `GET /sky/query/<eci>/io.picolabs.pico-engine-ui/pico`, or `<alias>:pico()` from KRL with `use module io.picolabs.pico-engine-ui alias <alias>`

### `logs()` → Array

Recent activity on this pico, grouped by transaction, newest first: each incoming event or query with the rules it selected, klog output, and errors. The developer UI's own queries are left out.

**Call:** `GET /sky/query/<eci>/io.picolabs.pico-engine-ui/logs`, or `<alias>:logs()` from KRL with `use module io.picolabs.pico-engine-ui alias <alias>`

### `testingECI()` → String

The channel the developer UI's Testing tab last selected for sending events and queries to this pico, or null.

**Call:** `GET /sky/query/<eci>/io.picolabs.pico-engine-ui/testingECI`, or `<alias>:testingECI()` from KRL with `use module io.picolabs.pico-engine-ui alias <alias>`

### `testingHistory(rid?)` → Map

Recent Testing-tab sends for this pico, keyed by ruleset rid (newest first).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `rid` | String | no |  | optional ruleset id; omit for the full map rid → entries |

**Call:** `GET /sky/query/<eci>/io.picolabs.pico-engine-ui/testingHistory?rid=…`, or `<alias>:testingHistory(rid?)` from KRL with `use module io.picolabs.pico-engine-ui alias <alias>`

### `testingSaved(rid?)` → Map

Named Testing-tab requests kept on this pico, keyed by ruleset rid.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `rid` | String | no |  | optional ruleset id; omit for the full map rid → entries |

**Call:** `GET /sky/query/<eci>/io.picolabs.pico-engine-ui/testingSaved?rid=…`, or `<alias>:testingSaved(rid?)` from KRL with `use module io.picolabs.pico-engine-ui alias <alias>`

### `name()` → String

This pico's display name in the developer UI ("Pico" if never set).

**Call:** `GET /sky/query/<eci>/io.picolabs.pico-engine-ui/name`, or `<alias>:name()` from KRL with `use module io.picolabs.pico-engine-ui alias <alias>`
