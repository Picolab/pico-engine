# Explicit Events for Error Handling

> **Note:**
>
> System-raised errors are on the todo list.

Events are a natural way to handle errors. KRL makes use of its built in event system to process errors. Raising events for errors and then handling them with rule sets gives developers a great deal of flexibility in dealing with exceptional situations in their code.

# System-Raised Errors

KRE will raise errors for various system-level errors that happen during the execution of a KRL rule set. For example, KRL will raise an error when a rule attempts to take an undefined action or for a type mismatch on an operator—for example, applying the `length()` operator to an integer.

When KRE raises an error event, it uses the event domain `system` and the event type `error`. The following event attributes are attached to the event:

- `level`**.** The level of the event: error, warn, info, or debug. Processing of the rule continues for all levels except error where execution is terminated.
- `msg`**.** A string giving details about the error.
- `error_rid`**.** The rule set ID of the offending rule set.
- `rule_name`**.** The name of the offending rule.
- `genus`**.** A token from the top level of the error taxonomy (described momentarily), indicating the first-level classification of the error.
- `species`**.** A token from the second level of the error taxonomy, indicating the classification of the error within the genus

Because one error often cascades into others, KRE limits the number of errors from a single event to just one.

The KRL error taxonomy provides a two-level classification of errors. Unless otherwise noted, all of the errors in the following taxonomy are raised at the warn level.

- action
  - undefined
- data
  - conversion failed
  - source unavailable
- expression
  - invalid operator
  - type mismatch
  - recursion threshold exceeded
  - array reference undefined
  - function undefined
- module
  - function undefined
  - module undefined
- operator
  - type mismatch
- system
  - malformed event
  - ruleset_not_installed
  - unknown

# Program-Raised Errors

KRL programs can raise errors explicitly in the rule postlude. User-raised errors have the event domain `system` and the event type `error`. The genus is set to `user`.

The syntax of an explicit error statement is as follows:

```javascript
error <level> <expr>
```

In this statement, `<level>` is one of `error`, `warn`, `info,` or `debug`, and `<expr>` is any valid KRL expression. The expression will be sent as an event attribute with name `data`.

If `<level>` is `error`, all rules added to the current execution schedule are removed, also preventing further execution of the rule that raised the error. This type of error can still be handled, as shown in the Handling Errors section below.

The following example would raise an event with domain `system,`type `error,` genus `user,` level `info` and a message with the value of a variable named `query` if the rule were to fire:

```javascript
fired {
  error info "query:"+query
}
```

The following would only raise the event if the query variable were empty:

```javascript
fired {
  error info "Empty query" if(query like "^$")
}
```

Explicit errors set the `rid` and `rule_name` attributes from the current rule set ID and rule name.

# Handling Errors

Handling errors is as easy as creating a rule with the right select statement. For example, the following rule will log everything about the error:

```javascript
rule process_error {
  select when system error
  pre{
    level = event:attr("level")
    data = event:attr("data")
    rid = event:attr("rid")
    rule_name = event:attr("rule_name")
    genus = event:attr("genus")
    info = {
      "level": level,
      "data": data,
      "source": rid+":"+rule_name,
      "genus": genus,
      "time": time:now()
    }
  }
  always{
    log error info.encode()
  }
}
```

Like any other event, if an error event is raised and no rule is selected for it, nothing happens.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189902) (last edited there 2017-09-13).</small>
