# ctx

The `ctx` module provides context information and actions for running code. Context includes the pico, ruleset, and engine the code is running for and on.

## ctx:picoId

Get the identifier for the pico assigned by the engine. 

## ctx:rid

Get the ruleset id (rid) string.

## ctx:rid_version

The ruleset version string.

## ctx:rid_url

The ruleset url string.

## ctx:rid_config

The configuration Map when the ruleset was installed onto the pico.

## ctx:parent

The eci string of the parent or null if there is no parent.

## ctx:children

A list of the eci strings of the pico's children.

## ctx:channels

A list of all channels this pico owns.

TODO channel schema

## ctx:rulesets

A list of all the rulesets the pico has installed

## ctx:raiseEvent(domain, name, attrs)

Raise an event to yourself. This event does not use a channel, only runs on the current pico, and happens in the same event schedule.

- `domain` - String - The event domain.
- `name` - String - The event name.
- `attrs` - Map - The event attributes.

## ctx:query(eci, rid, name, args = {})

Query a local pico.

- `eci` - String - Which channel to send the query over.
- `rid` - String - The rid you wish to query.
- `name` - String - The name of the function you wish to query.
- `args` - Map - Any query function arguments where the map keys match the argument name.

## ctx:event(eci, domain, name, attrs = {})

Send an event to a local pico. 

- `eci` - String - Which channel to signal the event to.
- `domain` - String - The event domain.
- `name` - String - The event name.
- `attrs` - Map - The event attributes.

## ctx:eventWait(eci, domain, name, attrs = {})

- `eci` - String - Which channel to signal the event to.
- `domain` - String - The event domain.
- `name` - String - The event name.
- `attrs` - Map - The event attributes.

## ctx:eventQuery(eci, domain, name, attrs, rid, qname, args = {})

Signal an event then query immediately after the event finished processing.

- `eci` - String - Which channel to signal the event to and query over.
- `domain` - String - The event domain.
- `name` - String - The event name.
- `attrs` - Map - The event attributes.
- `rid` - String - The rid you wish to query.
- `qname` - String - The name from the ruleset you wish to query.
- `args` - Map - Any query function arguments where the map keys match the argument name.

## ctx:newPico(rulesets = [])

Create a new child pico. This returns the channel you can use to talk the child pico.

- `rulesets` - Array - List of the rulesets you wish installed on this pico when it's created.

Example:

```krl
ctx:newPico([
    {"url": "http://.../ruleset.krl", "config": {"some": "config"}}
])
```

## ctx:delPico(eci)

Delete a child pico.

- `eci` - String - The parent's eci for talking to the child. No other eci will work.

## ctx:newChannel(tags, eventPolicy, queryPolicy)

- `tags` - String[] - An array of tags to organize your channels
- `eventPolicy` - EventPolicy - Your event allow/deny rules
- `queryPolicy` - QueryPolicy - Your query allow/deny rules

## ctx:putChannel(eci, tags, eventPolicy, queryPolicy)

Same as newChannel except you provide the eci you whish to modify. Channels can only be modified by their owners.

## ctx:upsertChannel(tags, eventPolicy, queryPolicy)

If there is a channel with the same tags it will update it. Otherwise it will create a new channel.

## ctx:delChannel(eci)

Delete a channel. Only the owner pico can delete their channel.

## ctx:install(url, config = {})

Install a ruleset.

- `url` - String - The url to the ruleset you wish to install.
- `config` - Map - Any configuration data the ruleset may want.

## ctx:uninstall(rid)

Uninstall a ruleset.

- `rid` - String - The id of the ruleset you wish to uninstall.

## ctx:flush(url)

Flush a ruleset by fetching the url and reloading it.

- `url` - String - The url to the ruleset you wish to flush.
