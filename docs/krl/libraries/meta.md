# meta

The `meta` library provides information about the running ruleset. The following are available (notice that these are values, *not* functions):

- **`meta:eci`** - the event channel identifier on which the current event was raised
- **`meta:host`** - the public DNS name of the machine running the engine, including port number. Does not include the trailing "/". ex. http://localhost:8080 You may configure this value when starting your pico engine. See the [developer tips](https://picolabs.atlassian.net/wiki/spaces/docs/pages/31544297/Developer+Tips+for+Pico+Engine) page to see why and how.
- **`meta:inEvent`** - Boolean value `true` if the engine is evaluating an event for this pico, `false` otherwise
- **`meta:inQuery`** - Boolean value `true` if the engine is evaluating a query for this pico, `false` otherwise
- **`meta:picoId`** - the ID of the currently running pico
- **`meta:rid -`** the ruleset ID of the currently running ruleset
- **`meta:ruleName`** - the name of the rule currently being evaluated
- **`meta:rulesetURI`** - the URL from which the currently running ruleset was registered/installed
- **`meta:txnId`** - the transaction ID for the current evaluation. This is mostly useful for debugging or as a correlation identifier
- **`meta:rulesetConfig`** - the configuration Map given when the ruleset was installed in the pico

> **Note:**
>
> ### Wrangler and Meta
>
> Some of the data in the [meta](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189908/Meta+Section) block is also available through [Wrangler](https://picolabs.atlassian.net/wiki/spaces/docs/pages/11403286/Wrangler+Overview):
>
> `wrangler:rulesetMeta(meta:rid){"author"}` - the author from the meta section of the current ruleset
>
> `wrangler:rulesetMeta(`meta:rid){"description"} - the `description` from the meta section of the current ruleset
>
> `wrangler:rulesetMeta(`meta:rid){"name"} - the `name` from the meta section of the current ruleset

> **Note:**
>
> Not Supported
> The following are *not yet available*:

- **`meta:callingRID()`** - returns the RID of the calling ruleset if running in a module, or the current ruleset ID otherwise.
- **`meta:callingVersion()`** - returns the version of the calling ruleset if running in a module, or the current ruleset version otherwise.
- **`meta:errorCount()`** - returns the number of errors for current rule execution. Reset to 0 for each new rule execution.
- **`meta:inModule()`** - returns a Boolean value indicating whether the current code is running in a module.
- **`meta:moduleRID()`** - returns the RID of the module if running in a module, or the current ruleset ID otherwise.
- **`meta:moduleVersion()`** - returns the version of the module if running in a module, or the current ruleset version otherwise.
- **`meta:version()`** - returns the version of the currently running ruleset.

Note, in the case of `meta:moduleRID()`, `meta:moduleVersion()`, and `meta:inModule()`, care has been taken to preserve static behavior. So, for example, if you do the following, you should get the result you expect based on static function semantics:

```javascript
ruleset my_module {

  ...
  global {
    myRid = function() { meta:rid }
  }
}

ruleset use_my_module {
  meta {
    use module my_module
  }
  global {
    x = my_module:myRid();
    // x = my_module, not use_my_module
  }
}
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189924) (last edited there 2021-01-28).</small>
