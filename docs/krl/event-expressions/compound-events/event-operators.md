# Event Operators

Event operators combine event expressions into even more complex event expressions using operators that relate sub-expressions to each other. Bear in mind that you're not interested in a forensic exercise in which you examine logs of event occurrences. Rather, you apply event patterns to live, real-time event streams. This colors the semantics slightly.

**A `or` B.** Eventex A matches or eventex B matches. There is no expectation of order. If either subexpression matches, then the entire expression matches. In the following example, the expression would match if the user viewed a page with the string "bar.html" in its URL or received a phone call from a number with area code 801.

```javascript
select when web pageview url re#bar.html#
         or phone inbound_call from re#801\d+#
```

**A `and` B.** Eventex A matches and eventex B matches in any order. In the following example, the expression would match if the user viewed a page that contained the string "bar.html" in its URL and viewed another page that contained the string "foo.html." There are two events, both of which must occur independently for this match to occur. Once a match occurs the state machine resets, so you'll need to see both urls again before another match.

```javascript
select when web pageview url re#bar.html#
        and web pageview url re#foo.html#
```

**A `before` B.** Eventex A matches before eventex B matches. Another way to understand this is that event A appears before event B in the event stream. The compound event matches when event B occurs. There may be intervening events between A and B. The following eventex would match if the user viewed a page with the right URL before the `inbound_call` event is received. Both events have to occur before this eventex matches.

```javascript
select when web pageview url re#bar.html#
     before phone inbound_call
```

**A `then` B.** Eventex A matches, then eventex B matches with no intervening salient events. The following eventex would match if the user viewed a page with the right URL and the next event signals an `inbound_call`. Both events have to occur before this eventex matches.

```javascript
select when web pageview url re#bar.html#
       then phone inbound_call
```

**A `after` B.** Eventex matches if A occurs after B. This is equivalent to B before A. The following eventex would match if the user viewed a page with the right URL after the `inbound_call` event is received. Both events have to occur before this eventex matches.

```javascript
select when web pageview url re#bar.html#
      after phone inbound_call
```

**A `between`(B, C).** Eventex A matches between eventex B matching and eventex C matching. The compound event matches when event C occurs. In the following example, the eventex would match if the user viewed a page with a URL that contains the string "mid.html" between viewing pages that have URLs that contain the strings "first.html" and "last.html," respectively. Note that this eventex will match only after the page view with "last.html" occurs.

```javascript
select when web pageview url re#mid.html#
              between(web pageview url re#first.html#,
              web pageview url re#last.html#)
```

**A `not between`(B, C).** Eventex A did not match between eventex B matching and eventex C matching. The compound event matches when event C occurs. The following eventex would match if the user did not view a page with a URL that contains the string "mid.html" between viewing pages that have URLs that contain the strings "first.html" and "last.html," respectively. Note that this eventex will match only after the page view with "last.html" occurs.

```javascript
select when web pageview url re#mid.html#
             not between(web pageview url re#first.html#,
                         web pageview url re#last.html#)
```

Variables are not captured in compound eventexes. Variables can be set based on regex captures for primitive eventexes as part of the primitive event.

```javascript
select when web pageview url #mid.html#
        not between(web pageview url re#(\d+).html# setting(b),
                    web pageview url re#(\d+).html# setting(c))
```

For simplicity, the preceding examples use a single primitive eventex (`pageview`) but there's no restriction on using different event types from different event domains in an eventex. In fact, the most interesting eventexes usually involve more than one event type:

```javascript
select when phone inbound_call from re#(\d{3})\d+# setting(area_code)
              between(web pageview url re#custserv_page.html#,
                      web pageview url re#homepage.html#)
```

Of course, compound eventexes can be nested. Parentheses specify order where precedent is not apparent.

```javascript
select when web pageview url re#mid.html#
              between(web pageview url re#\d+.html#,
                      web pageview url re#\d+.html#)
     before web pageview url re#/archives/(\d+)/foo.html# setting (year)
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189877) (last edited there 2018-08-31).</small>
