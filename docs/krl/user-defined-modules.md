# User Defined Modules

Any KRL ruleset can function as a module if it contains the `provides` pragma in the `meta` section of the ruleset. KRL modules are parameterized and can be included more than once with different parameters. A module may include, and use, other modules.

When defined as a module, any of the global definitions may be provided to rulesets that use the module. Rules cannot be shared.

# Using a Module

A ruleset uses another ruleset as a module with the `use module` pragma. The syntax is:

```javascript
meta {
  ...
  use module <ruleset name>
    [alias <string>]
    [with <var> = <expr> [<var> = <expr>]*]
}
```

The `<ruleset name>` is the name of the ruleset to use as a module. Note that this is the RID that the ruleset manager knows the ruleset by, not the name declared in the `meta` section of the ruleset.

Any global definitions in that ruleset that have been declared in the `provides` pragma of the module will be available in the using ruleset. You can reference these declarations in the using ruleset by namespacing the variable name from the module with the module's name (i.e. its ruleset name).

For example, if ruleset with RID `com.windley.krl.blast` provides `flip` then it can be referenced in a ruleset using `com.windley.krl.blast` as follows:

```javascript
global {
  x = com.windley.krl.blast:flip * 3;
}
```

> **Note:**
>
> ### Code doesn't compile
>
> The above code doesn't compile. The syntax of a ruleset identifier (RID) allows it to contain periods and hyphens. But those are not allowed in identifiers, so the string preceding the colon above is *not* an identifier. The next section shows how to work around this.

## Aliasing

The optional `alias` keyword declares an alias for the ruleset name. So if `com.windley.krl.blast` ruleset is used as follows:

```javascript
use module com.windley.krl.blast alias please
```

then, the preceding example would look like this:

```javascript
global {
  x = please:flip * 3;
}
```

**Note:** the following are the names of engine libraries and should not be used as module aliases. Inside a ruleset that does use one, the name means that ruleset's module and the library is out of reach:

- `csv`
- `ctx`
- `dido`
- `ent`
- `event`
- `http`
- `ical`
- `keys`
- `math`
- `meta`
- `oauth`
- `random`
- `rss`
- `schedule`
- `telnet`
- `time`
- `uri`
- `wrangler`

## Configuration

The optional `with` clause declares configuration values for the used module. The expressions on the righthand side of the `with` clause must be evaluable before anything in the ruleset has been evaluated. That means that the righthand side is limited to expressions that use:

- literals
- keys
- event attributes
- environment values

See below for more information on module configuration.

# Declaring a Module

Strictly speaking, any ruleset can be used as a module but only rulesets that contain the `provides` pragma in their `meta` section will be useful since only global definitions explicitly marked for export in the `provides` pragma will be available in the using ruleset. If the ruleset contains no `provides` pragma or one that is empty or names values not declared in the module, nothing will be usable in the using ruleset.

The syntax for provides is

```javascript
provides <var> [,<var>]*
```

The list of provided declaration is given as a comma separated list of names.

Often it's useful to know whether or not a ruleset is running as a module. The [meta library](/krl/libraries/meta) provides functions (not yet implemented) that give information about the running ruleset, including whether it's running as a module or not.

## Configuring a Module

When a module is used, the `with` clause allows the module to be configured. This provides for module parameterization. The configuration is declared using the `configure` pragma in the `meta` section of the module. The syntax is as follows:

```javascript
configure using <var> = <expr> [<var> = <expr>]*
```

Only variables declared in the `configure` pragma will be configurable from the using ruleset. The `<expr>` gives a default value for the configuration parameter. If the `with` clause is used to declare configuration values when the module is used, then those values will override any defaults in the configuration of the module.

Variables declared in the configuration are available as regular variables throughout the module. A typical use of the module configuration is to pass in user keys from a ruleset's [`keys`](https://picolabs.atlassian.net/wiki/pages/createpage.action?spaceKey=docs&title=Keys&linkCreation=true&fromPageId=1189590) declaration so that the module can use them.

# Example

Consider the following ruleset that is intended for use as a module (note the `provides` and `configure` pragmas):

```javascript
ruleset com.windley.krl.blast {
  meta {
    name "cs_module"
    description <<
For testing modules
System tests depend on this ruleset.
>>
    configure using c = "Hello"
    provides a, f, g
  }
  global {
    a = 5;
    b = 6;
    f = function(x){x + b};
    g = function(){ent:c}
  }
}
```

Suppose that we used this module as follows:

```javascript
ruleset foobar {
  meta {
    use module com.windley.krl.blast alias blast
  }
  global {
    x = blast:a + 4;
    y = blast:f(4);
  }
  ...
}
```

When rules in ruleset `foobar` execute, `x` will have the value 9 and `y` will have the value 10. Note that if we had referenced `blast:b` it would be undefined since `b` is not in the `provides` pragma in the module.

# Module Configuration and Aliasing

The following example shows how module configuration and aliasing can be used effectively.

The following ruleset defines a module that defines a function and two actions to interact with a data service called `StringBin` (a simple cloud-based key-value pair storage system). StringBin requires a developer pin.

```javascript
ruleset com.windley.krl.stringbin {
  meta {
    name "StringBin Module"
    provide read, write, destroy
    configure using pin = "nopin"
  }
  global {
    write = defaction (k, v) {
      http:post("http://api.stringbin.com/1/write",  params =
                     { "pin": pin,
                       "key": k,
                       "value": v
                     }
    }
    destroy = defaction (k) {
      http:post("http://api.stringbin.com/1/write", params =
                     { "pin": pin,
                       "key": k,
                       "value": ""
                     }
    }
    read = function(k) {
      http:get("http://api.stringbin.com/1/read", params =
                     { "pin": pin,
                       "key": k
                     }
    }
  }
}
```

Two important things to note in this module definition are the `provide` and `configure` pragmas. The `provide` pragma is followed by a list of names that will be available outside the module. Note that the `datasource` declaration `sb_data` is not provided to rulesets using the module and thus the implementation details are hidden. The only way to reach the datasource is using the provided function named read.

The configure keyword indicates the module parameters and their default values. In this case there is one parameter, the value of the developer pin. Any ruleset using this module must supply a pin or it won’t work since the default value is “nopin.”

We use a module by declaring its use in the meta section, giving any configuration parameters using a with clause. The use module pragma requires a ruleset name and an optional alias (StringBin in this case)

```javascript
meta {
  use module com.windley.krl.stringbin alias StringBin
    with pin = "X9ooUUsrR180MkpxZ2N1M"
}
```

Later we can use one of the module’s actions in a rule like so:

```javascript
rule write_to_stringbin {
  select when web pageview
  StringBin:write("yellow", "mellow")
}
```

This rule writes the value “mellow” to the StringBin store using the key “yellow.” Note that when we declared the module’s use we gave it an alias and the alias is used to namespace the action (`StringBin:write()` in this case)

Because modules are parameterized and can be aliased, you can use a given module multiple times in a single ruleset with different parameters. For example, suppose we had two StringBins and we wanted to copy a value out of one into the other. First, we declare the module’s use twice with different aliases and configurations:

```javascript
meta {
  use module com.windley.krl.stringbin alias BinA
    with pin = "X9ooUUsrR180MkpxZ2N1M"
  use module com.windley.krl.stringbin alias BinB
    with pin = "ada98u0ada0kkdad0a0da"
}
```

Because we give each use of the StringBin module a different pin, they will reference different string bins.

We can use the aliased modules to write a rule that copies data from BinA into BinB:

```javascript
rule copy_stringbin {
  select when web pageview
  pre {
    stuffToCopy = BinA:read("yellow");
  }
  BinB:write("yellow", stuffToCopy);
}
```

In this rule, we’ve read data from `BinA` and then written it to `BinB`. Of course, in a real rule to accomplish this, the key (“yellow”) would likely be computed from event parameters in some way.

# Modules are Closures

Rulesets form closures over the value defined in them. This is true when the ruleset is used as a module as well. All variables are scoped statically, not dynamically, whether in the global variable bindings or inside rules. This applies to persistent variables as well.

This has important implications for how rulesets that are also modules behave.   Here’s a detailed look at what this means. Suppose we defined the following ruleset:

```javascript
ruleset foo {
  meta {
    provides get_item
  }
  global {
    get_item = function (k) {
      ent:elements{k};
    };
  }

  rule add_item {
    select when pds new_data_available
    noop();
    always {
      ent:elements{event:attr("key")} := event:attr("value");
      raise pds event "new_item_added";
    }
  }
}
```

The `provides` pragma in the `meta` section indicates that this ruleset is intended to be used as a module. Note that `get_item()` references an entity variable ([`ent:elements`](http://entelements)). An entity variable with the same name is mutated in the rule `add_item`. Because this ruleset will function as a closure over the value in `ent:elements`,  the value of `ent:elements` retrieved by `get_item()` is the same as the one mutated in the rule.

# Module Caching

When a module is evaluated, a variable environment is created based on the declarations in the module and the module configuration. The environment is cached for performance reasons when possible. The performance benefits of module caching are substantial.

### Cachability

In general, as long as the global declarations in your module fall into the following categories, your module will be cachable:

- function definitions
- action definitions
- literals
- simple variables
- expressions involving the preceding items

Any expression involving a [persistent variable](/krl/persistent-variables/) will not be cachable unless the persistent variable is wrapped in a function or action definition. Also, some specific built-in functions that have dynamic values cannot be cached. If your module cannot be cached, it will still work, but may perform poorly. Developers should work to ensure their modules are cachable.

> **Warning:**
>
> ### Don't Try to Fool the Caching Algorithm
>
> You can wrap something that isn't cachable (such as a persistent variable) in a function to make it cachable and then immediately call the function, providing the result from the module (see the examples below). While the system will determine that your module is cachable, the result provided will be stale if the wrapped persistent variable is updated, since that will not invalidate the cache.

### Examples

```javascript
global {
  // the following declarations are cachable
  a = 5;
  b = x + 5;
  get_item = function (k) {
      ent:elements{k};
    };

  // the following declarations are not cachable
  a = ent:elements{"name"};
  b = meta:callingRID();

  // the following is cachable, but will lead to stale results
  q = get_item("name")

}
```

### Is My Module Being Cached

If you turn logging on for a ruleset including your module, you'll be able to see whether or not your module is being cached in the debug information.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189590) (last edited there 2021-02-08).</small>
