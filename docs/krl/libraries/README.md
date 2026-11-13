# Libraries

KRL has several libraries that are useful for dealing with special data types and extend the allowed functions. In general, to reference a function from a library, you use the following syntax:

```
<library-name>:<function-name>(<arg0>,<arg1>,...,<argn>)
```

The engine provides these libraries to every ruleset:

- [CSV](/krl/libraries/csv): comma-separated values to and from arrays of maps
- [ctx](/krl/libraries/ctx): the pico and the engine (an escape hatch; applications use [wrangler](/wrangler/))
- [event](/krl/libraries/event): the current event, and sending events
- [HTTP](/krl/libraries/http): HTTP requests
- [ical](/krl/libraries/ical): iCalendar files
- [math](/krl/libraries/math): math, hashing, and base64
- [meta](/krl/libraries/meta): the ruleset and the current request
- [oauth](/krl/libraries/oauth): a mesh's OAuth state (for `io.picolabs.oauth`)
- [random](/krl/libraries/random): random numbers, words, and IDs
- [rss](/krl/libraries/rss): RSS and Atom feeds
- [schedule](/krl/libraries/schedule): scheduled events
- [Telnet](/krl/libraries/telnet): connections to telnet hosts
- [time](/krl/libraries/time): dates and times
- [URI](/krl/libraries/uri): escaping strings for URIs

A ruleset that uses a module with one of these names as its alias gets its module, not the library.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189596) (last edited there 2017-05-26).</small>
