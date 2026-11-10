# Event Expressions and Time

Time is an important component of many events. There are two ways to use time:

- As an explicit condition on primitive [eventexes](/krl/event-expressions/)
- As a relative comparison of the timestamps on the components of an event expression

## Explicit Time Expressions

Events can contain a `timestamp` attribute. You can use the `timestamp` attribute in explicit conditions on primitive events. Because the `timestamp` attribute is a datetime object, the time module operators can be used to manipulate the timestamp as part of the [attribute expression](/krl/event-expressions/finding-individual-events/attribute-expressions) of a primitive eventex. (The built-in operator `time:new()` is used to convert strings into datetime objects.)

For example, suppose your car raised an event each time it was started. You could create an eventex that only selects when the car is started before 8 a.m. as follows:

```javascript
select when car started where time:compare(event:attr("timestamp"),time:new("8:00:00")) < 0
```

The `time:compare()` function returns -1 if the first argument is less than the second, 0 if they are equal, and 1 if the first argument is greater than the second.

## Relative Event Expressions

Relative event expressions compare the timestamps of the event subexpressions. The `within` operator is used:

```javascript
A <eventop> B within n <period>
```

This eventex matches only if the compound event expression `A <eventop> B` happens within the specified period. The `<eventop>` can be any of the event operators from the [preceding section](/krl/event-expressions/compound-events/event-operators). (Note that the `within` semantics don't make sense for the `or` operator. Using it in that context is not syntactically wrong, but accomplishes nothing.) The `<period>` can be one of `seconds`, `minutes`, `hours`, `days`, or `weeks`. For example:

```javascript
select when web pageview url re#custserv_page.html#
     before web pageview url re#homepage.html#
   within 3 hours
```

This eventex would match an event stream where a page view with a URL for the customer-service page came before the page view with a URL for the home page as long as those two events occurred within three hours of each other.

If the `within` clause is applied to a nested event, the period tested is between the first match and the last match of the entire nested eventex. For example:

```javascript
select when inbound_call from re#^801-\d+#
     before(web pageview url re#custserv_page.html# and
            web pageview url re#homepage.html#)
  within 3 hours
```

This eventex would match an event stream where the page view with a URL for the customer-service page and the page view with a URL for the home page occurred after a phone call from the 801 area code, as long as the final page view occurred within three hours of the inbound call.

## Conditions and Alarms

Be careful not to confuse timestamp conditions eventexes with absolute time alarms. For example, consider the following eventex:

```javascript
select when car started where time:compare(event:attr("timestamp"),time:new("8:00:00")) < 0
```

This will match as soon as the car is started, as long as the car is started before 8 a.m.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189876) (last edited there 2018-02-13).</small>
