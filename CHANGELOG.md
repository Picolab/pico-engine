# 0.45.2 - March 12, 2018

* Guess the `meta:host` rather than defaulting to localhost - [#370](https://github.com/Picolab/pico-engine/issues/370)
* [85f2d35e](https://github.com/Picolab/pico-engine/commit/85f2d35e) display outbound DID
* [bf3efbe0](https://github.com/Picolab/pico-engine/commit/bf3efbe0) a bit more subscriptions UI
* [c4492a81](https://github.com/Picolab/pico-engine/commit/c4492a81) more subscriptions UI
* [9b9d5655](https://github.com/Picolab/pico-engine/commit/9b9d5655) UI to propose new subscription

# 0.45.1 - March 8, 2018

* Fixing string to number coercion described in [#368](https://github.com/Picolab/pico-engine/issues/368). Fixes date compare issue [#369](https://github.com/Picolab/pico-engine/issues/369)
* [b74dabb](https://github.com/Picolab/pico-engine/commit/b74dabb) - more consistent tab UX
* [fbcc843](https://github.com/Picolab/pico-engine/commit/fbcc843) - initial attempt UI to delete subscription
* [32bab20](https://github.com/Picolab/pico-engine/commit/32bab20) - fixing edge case for core.db.getStateMachine
* [e200d6c](https://github.com/Picolab/pico-engine/commit/e200d6c) - first attempt at Subscriptions tab
* [f747228](https://github.com/Picolab/pico-engine/commit/f747228) - first cut of UI work for subscriptions


# 0.45.0 - February 23, 2018

* Automated migration from `io.picolabs.pico` to `io.picolabs.wrangler` - [4c64693](https://github.com/Picolab/pico-engine/commit/4c64693c3dee9d4ccebffd1d89880d418d9c3e1d)
* Several fixes to `select .. setting() where ..` variable scope - [#362](https://github.com/Picolab/pico-engine/pull/362), [#329](https://github.com/Picolab/pico-engine/issues/329), [#358](https://github.com/Picolab/pico-engine/issues/358), [#359](https://github.com/Picolab/pico-engine/issues/359)
* Fixing type coercion behavior to be consistent especially for numbers and comparison operators - [#357](https://github.com/Picolab/pico-engine/issues/357), [#361](https://github.com/Picolab/pico-engine/pull/361)
* KRL editor `ctrl+S` binding - [#356](https://github.com/Picolab/pico-engine/issues/356)
* `schedule:remove(id)` returns true/false instead of throwing an error - [#363](https://github.com/Picolab/pico-engine/issues/363)
* KRL editor syntax highlight fix - [#355](https://github.com/Picolab/pico-engine/issues/355)
* Removing unused syntax - [#291](https://github.com/Picolab/pico-engine/issues/291), [#293](https://github.com/Picolab/pico-engine/issues/293)
* Prevent ruleset dependency cycles - [#260](https://github.com/Picolab/pico-engine/issues/260), [#261](https://github.com/Picolab/pico-engine/issues/261)
* `event:send` now signals the event right away instead of waiting for the rules to complete - [#364](https://github.com/Picolab/pico-engine/pull/364)
* UI fixes - [9647717](https://github.com/Picolab/pico-engine/commit/9647717f9fae11f169820720b2747715d935ae38), [fa506d1](https://github.com/Picolab/pico-engine/commit/fa506d1733cb6c48c21396225e37c6167028f649), [94c1b63](https://github.com/Picolab/pico-engine/commit/94c1b63e001568a5b0701a0664e9595ecf0b0438), [a7ad98d](https://github.com/Picolab/pico-engine/commit/a7ad98d0a22b5278899115dbbddb5722cd8ad982), [97f7d5d](https://github.com/Picolab/pico-engine/commit/97f7d5ded3fbc4fabbe38d5829af9e5f940dd3000)
* Store password as one way hash [5954b41](https://github.com/Picolab/pico-engine/commit/5954b41f05858cfab62b94831dd730c711561293)

# 0.44.1 - January 15, 2018

### Bug Fixes

* spaces in file:// urls - ([see #352](https://github.com/Picolab/pico-engine/issues/352))


# 0.44.0 - January 10, 2018

### New Features

* Making the shell log output more human friendly ([see #313](https://github.com/Picolab/pico-engine/pull/313))
* Storing pico-engine log file. Json encoded for easy parsing, and stored in `$PICO_ENGINE_HOME/pico-engine.log` ([see #313](https://github.com/Picolab/pico-engine/pull/313))
* Channel policies. Right now it defaults to allow-all. ([see #350](https://github.com/Picolab/pico-engine/pull/350))
* allow path rewriting as directed by root pico ([see commit](https://github.com/Picolab/pico-engine/commit/a2255507f6da3b6adb7486f20b34f6d04383ac00))
* Switching to new wrangler and subscriptions. ([see #351](https://github.com/Picolab/pico-engine/pull/351))

### Upgrade notes

Because we changed `io.picolabs.pico` to `io.picolabs.wrangler`.
* Uninstall `io.picolabs.pico` from the Root Pico. (open the root pico -> Rulesets tab -> click `del` on `io.picolabs.pico`).
* For the other picos install wrangler then uninstall the old pico ruleset.


# 0.43.0 - December 11, 2017

### Deprecations

* `event:attrs()` in favor of `event:attrs`
* `keys:<name>()` in favor of `keys:<name>`
* Map key access using `.` operator

### New Features

* signed subscriptions
* encrypted subscriptions
* better type checking on `engine:*` function arguments
* new KRL editor with inline compiler warnings and errors

### Bug Fixes

* `select when` matching falsy event attributes
* More forgiving handling of ruleset initialization errors on startup (i.e. breaking compiler changes)
* [see issues](https://github.com/picolab/pico-engine/issues?utf8=%E2%9C%93&q=is%3Aissue+0.43) for more

# 0.42.0 - November 1, 2017

### BREAKING CHANGES

* we now only support node 6+, recommended you use the LTS version (v8)

### New Features

* persistent variable indexes by using path expressions i.e. `ent:foo{key}`

# 0.41.0 - October 31, 2017

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
