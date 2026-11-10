# Explicit Logging

The syntax of an explicit logging expression is:

```javascript
<expr>.klog(<message>)
```

where `<expr>` is any valid KRL expression. The expression is returned, and something like the following is added to the console log (and the "Logging" tab of the UI if enabled):

```javascript
[KLOG] <message> <expr converted to a string>
```

The syntax of an explicit logging statement in the postlude is:

```javascript
log <level> <expr>
```

where `<level>`is one of `info`, `warn`, `error`, or `debug`; and `<expr>` is any valid KRL expression that results in a string (or something that can be cast as a string such as a number). Explicit logging statements also place the log message in the console log, and the "Logging" tab of the UI if enabled.

The following example would place a string with the value of a variable named `query` in the log if the rule fired:

```javascript
fired { log debug "query:"+query }
```

The following would only log with an empty query:

```javascript
fired { log debug "Empty query" if(query like "^$") }
```

The following rule is selected when an `http:post()` event is seen with a status code indicating an error. The error is logged and then processing is stopped.

```javascript
rule r3 is active {
  select when http post label re#ex# status_code re#([45]\d\d)# setting (status)
  noop();
  fired {
    log error <<Error: #{status}: #{event:attr("status_line")}>>
    last;
  }
}
```

Another approach to logging would use [explicit error handling](/krl/rulesets/rules/postlude/explicit-events-for-error-handling).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189900) (last edited there 2017-09-13).</small>
