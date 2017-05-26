# 0.11.1 - May 26, 2017

### New Features

* `random:uuid()` - return a globally unique id (using [cuid](https://www.npmjs.com/package/cuid))
* `random:word()` - return a random english word
* `random:integer(lower = 0, upper = 1)` - return a random integer between `lower` and `upper`
* `random:number(lower = 0, upper = 1)` - return a random number (float) between `lower` and `upper`

* if event.eid == "none" or is not given, it will default to a uuid

* `event:send(event, host = null)` - now when given a `host` string, it will send an async http sky/event request to that engine

### Bug Fixes

* `event:attr(name)` - see issue [#179](https://github.com/Picolab/pico-engine/issues/179)

# 0.11.0 - May 20, 2017

### New Features

* defaction can do anything a rule action can
```krl
<name> = defaction(<params...>){
     <declaration 0>
     <declaration 1>
     ...
     <action block (i.e. anything you would put in a rule action)>
}
```

For example
```krl
chooser = defaction(val){

    baz = "hello"
    qux = "bye"

    choose val {
        asdf =>
            foo(val)
        fdsa =>
            bar(val, "ok", "done")
    }
}
```

* default parameters for function and defaction (no more `configure using`)

```krl
foo = function(bar = 2, baz = bar + 3){
    bar + baz
}

//-or- when it gets too long
foo = function(
    bar = 2,
    baz = bar + 3,
    qux = 4,
    quux = blah(qux),
){
   ...
}


//defaction parameters work the same way as functions
```

### BREAKING CHANGES

* You can no longer use actions as functions

```krl
//the following are now actions and cannot be used as a function
engine:newPico
engine:removePico
engine:newChannel
engine:removeChannel
engine:registerRuleset
engine:unregisterRuleset
engine:installRuleset
engine:uninstallRuleset
event:send
schedule:remove
```

### Bug Fixes

* re-registering rulesets breaks the schedule order
