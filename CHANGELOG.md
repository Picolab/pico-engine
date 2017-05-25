# 0.12.0 - May 25, 2017

### New Features

* defaction can optionally return values
```krl
<name> = defaction(<params...>){
     <declaration 0>
     <declaration 1>
     ...
     <action block (i.e. anything you would put in a rule action)>
    returns <expr 0>, <expr 1>
}
```

For example
```krl
foo = defaction(){
    every {
        http:get(...) setting(resp)
    }
    returns resp["content"]
}
...
rule bar {
    select when ...

    foo() setting(answer);
}
```

* new action block type: `sample` This will randomly select an action to run.
```krl
rule bar {
    select when ...

    //randomly pick one of these 3 actions
    sample {
        foo()

        bar()

        baz()
    }
}
```

* action block syntax. All semi-colons are optional but recommended
```
ActionBlock ->
      <action> ;
    | if <expr> then <action> ;
    | if <expr> then every  { <action 0> ; <action 1> ; ... }
    | if <expr> then sample { <action 0> ; <action 1> ; ... }
    | every  { <action 0> ; <action 1> ; ... }
    | sample { <action 0> ; <action 1> ; ... }
    | choose <expr> { <action 0> ; <action 1> ; ... }
```


### BREAKING CHANGES

* `with` is no longer used for named arguments. Both functions and actions.
```krl
//OLD WAY
foo(1, 2) with a = 3 and b = 4

//NEW WAY
foo(1, 2, a = 3, b = 4)
```

* `with` is no longer used on `raise`/`schedule`
```krl
//OLD WAY
raise domain event "type" with foo = 1 and bar = 2

//NEW WAY
raise domain event "type" attributes {"foo": 1, "bar": 2}
```

* `send_directive` no longer uses `with` it's now `send_directive(name, options = {})`
```krl
//OLD WAY
send_directive("name") with foo = x and bar = y

//NEW WAY
send_directive("name", {"foo": x, "bar": y})
```

* No optional semi-colon after `select when ...`
```krl
//OLD WAY
select when foo bar;

//NEW WAY
select when foo bar
```

### Bug Fixes

* syntax ambiguities caused by `with`

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
