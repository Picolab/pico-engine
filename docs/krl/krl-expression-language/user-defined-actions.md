# User-Defined Actions

User defined actions are created using the `defaction` keyword. The `defaction` keyword closely follows the syntax of functions. User-defined actions allow for data preprocessing and the execution of one or more actions. User-defined actions are useful for wrapping actions to allow for composite actions or a cleaner syntax surrounding existing actions for a common use case.

```javascript
defaction(<parameters>) {
  <declaration0>
  ...
  <declarationN>

  <action block>
}
```

The parameters are a possibly empty, comma-separated list of variable names. All parameters can be assigned a default value.  More details can be found in [Using Optional and Named Parameters](/krl/krl-expression-language/functions/using-optional-and-named-parameters).

Zero or more declarations can be included to prepare data for the action block.

The action block is the same as the action block in a rule. Any action, including a user-defined action, can be used in the action block. Actions can be simple or compound. A simple action is a valid action block. For example, the following defines an action called `send_warning` using the `event:send` action:

```javascript
send_warning = defaction(msg, eci) {
  event:send({"eci":eci, "domain":"message", "type":"warning", "attrs": {"warning":"Warning!" + msg}});
}
```

Compound actions work the same as a rule. Suppose, for example, that in addition to putting up a notification, you wished to use [send_directive](/krl/rulesets/rules/actions/taking-action/send-directive):

```javascript
send_warning = defaction(msg, eci) {

  every {
    event:send({"eci":eci, "domain":"message", "type":"warning", "attrs": {"warning":"Warning!" + msg}});

    send_directive("a_warning_was_given", {"message":"msg"})
  }
}
```

The variable `send_warning` only has meaning in an action context within a rule. Because user-defined actions are first-class values (i.e., they can be returned as the result of executing an expression), they can be passed into functions or other user-defined actions and returned as the result from a function. You can thus write recursive actions.

User defined actions may also return values. The returned value may be a string, map, array etc. Consider the following example that returns a map:

```javascript
    deleteChild = defaction(pico_name){
      ent_children = children(){"children"}
      child_collection = ent_children.collect(function(child){
                                              (child{"name"} ==  pico_name) => "to_delete" | "dont_delete"
                                            })
      child_to_delete = child_collection{"to_delete"}.head()

      every {
        engine:removePico(child_to_delete{"id"})
      }
      return
      {
        "updated_children": child_collection{"dont_delete"},
        "child": child_to_delete
      }
    }
```

To retrieve the returned value (in this case a map), bind it to a new name using "setting":

```
deleteChild(<give pico name>) setting(returnValue)
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189583) (last edited there 2020-12-29).</small>
