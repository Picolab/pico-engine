# 0.11.0 - May 19, 2017

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

### Features

* defaction can use full action blocks
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

### Bug Fixes

* re-registering rulesets breaks the schedule order
