# 0.13.0 - September 13, 2017

### Wrangler rewrite (krl/io.picolabs.pico.krl)

Wrangler provides a lot of the engine module functionality. It aims for easy, programmatically management of registering, installing, uninstalling, and listing rulesets, creation, deletion and listing of channels, as well as creation, deletion and listing of children picos. Wrangler allows you to write code to do everything that a user would us the UI for.

### New Features

* added testing for wrangler (see src/tests.js)
* every pico now has an "admin" channel. To get it use `engine:getAdminECI(pico_id)`
* `engine:newPico(pico_id)` now sets the parent id to `pico_id` creates an admin channel for you.
* added `engine:getParent(pico_id)` and `engine:listChildren(pico_id)`
* added `engine:listInstalledRIDs(pico_id)`
* all `engine:*` functions that have a `pico_id` argument now defaults to `meta:picoId`
* channel ECIs' are now sovrin DIDs.

### Bug Fixes

* sharing `defaction` between rulesets now return the right value
* system rulesets (those in `krl/`) now are loaded by dependency ordering.
* error handling on infinite recursion


# 0.12.5 - June 5, 2017

### Bug Fixes

* `.put()` should create nested maps, even if keys are numeric - see issue [#204](https://github.com/Picolab/pico-engine/issues/204)

# 0.12.4 - June 2, 2017

### Bug Fixes

* fixing race condition with `schedule .. at` - see issue [#203](https://github.com/Picolab/pico-engine/issues/203)

# 0.12.3 - June 2, 2017

### Bug Fixes

* fixing race condition with `schedule .. at` - see issue [#203](https://github.com/Picolab/pico-engine/issues/203)
* better error handling for `/sky/cloud/..` - see issue [#32](https://github.com/Picolab/pico-engine/issues/32)

# 0.12.2 - May 31, 2017

### New Features

* infix operators: `like`, `<=>`, `cmp` - see issue [#183](https://github.com/Picolab/pico-engine/issues/183)


### Bug Fixes

* better startup error handling - see issue [#112](https://github.com/Picolab/pico-engine/issues/112)
* consistent casting of key paths - see issue [#152](https://github.com/Picolab/pico-engine/issues/152)
* better `as("Number")` - see issue [#173](https://github.com/Picolab/pico-engine/issues/173)
* better string concatenation rules - see issues [#185](https://github.com/Picolab/pico-engine/issues/185) and [#155](https://github.com/Picolab/pico-engine/issues/155)
* report error when action used in `pre` block - see issues [#187](https://github.com/Picolab/pico-engine/issues/187)
* using `keys:<key>` in global - see issues [#132](https://github.com/Picolab/pico-engine/issues/132)


# 0.12.1 - May 26, 2017

### New Features

* `random:uuid()` - return a globally unique id (using [cuid](https://www.npmjs.com/package/cuid))
* `random:word()` - return a random english word
* `random:integer(lower = 0, upper = 1)` - return a random integer between `lower` and `upper`
* `random:number(lower = 0, upper = 1)` - return a random number (float) between `lower` and `upper`

* if event.eid == "none" or is not given, it will default to a uuid

* `event:send(event, host = null)` - now when given a `host` string, it will send an async http sky/event request to that engine

* better syntax for `choose` making the action block syntax consistent.
```
ActionBlock ->
      (if <expr> then)? <Actions>

Actions ->
      <action> ;
    | every         { <action 0> ; <action 1> ; ... }
    | sample        { <action 0> ; <action 1> ; ... }
    | choose <expr> { <action 0> ; <action 1> ; ... }
```

### Bug Fixes

* `event:attr(name)` - see issue [#179](https://github.com/Picolab/pico-engine/issues/179)




# 0.12.0 - May 25, 2017

### New Features

* defaction can return values (expose values to `setting(..)`)
```krl
<name> = defaction(<params...>){
     <declaration 0>
     <declaration 1>
     ...

     <action block (i.e. anything you would put in a rule action)>

    returns <expr 0>, <expr 1>, ...
}
```
NOTE: `returns` is optional

For example
```krl
global {
    foo = defaction(){

        send_directive("foobar")

        returns 1, 2, 3
    }
}
rule bar {
    select when ...

    foo() setting(a, b, c)

    fired {
        //a = 1, b = 2, c = 3
    }
}
```

Another example
```krl
global {
    foo = defaction(){
        every {
            http:get(...) setting(resp)
        }
        return resp["content"].decode()["msg"]
    }
}
rule bar {
    select when ...

    foo() setting(message)
}
```

* new action block type: `sample` This will randomly select an action to run.
```krl
rule bar {
    select when ...

    //randomly pick one of these 3 actions to run
    sample {
        send_directive("foo")

        send_directive("bar")

        send_directive("baz")
    }
}
```

* action block syntax. The semi-colons are optional.
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

* `with` is no longer used for named arguments. Both for **functions** and **actions**.
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
