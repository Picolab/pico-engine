# Group Operators

There are three group operators: `any`, `count`, and `repeat`.

## Any

`any n (E1,[el],Em)`. This matches if any *n* of eventexes E1 through Em match. In this eventex, *n* must be less than or equal to *m*. When *n* is not less than *m*, `any` behaves in the same way as a variable arity `and` operator, checking for matches of all the subexpressions. The following example shows how `any` can be used:

```javascript
select when any 2 (web pageview url re#customer_support.htm#,
                   phone inbound_call to re#801-649-4069#,
                   email received subject re#\[help\]#)
```

This eventex would match if any two of the three enclosed simple eventexes matched. The preceding eventex has the same semantics as this compound eventex:

```javascript
select when (web pageview url re#customer_support.htm# and
             phone inbound_call to re#801-649-4069#)
         or
            (phone inbound_call to re#801-649-4069# and
             email received subject re#\[help\]#)
         or
            (web pageview url re#customer_support.htm# and
             email received subject re#\[help\]#)
```

 I think you'll agree that the first eventex is clearer than the second one is!

## Count

`count n` **`(E)`.** This matches after *n* of eventex E have matched. When the count eventex matches, the counter is reset and the expression begins looking for n more of eventex E. Consider the following eventex:

```javascript
select when count 3 (E)
```

 The arrows on the event stream in the following diagram show where this eventex would match.

![Fig03-03.png](/krl/_media/1189886-Fig03-03.png)

## Repeat

`repeat n` **`(E)`.** This matches after *n* of eventex E have matched. When the repeat eventex matches, the counter is not reset, and the eventex matches using a sliding window on the event stream, always matching the last *n* of the eventex given in the subexpression. Consider the following eventex:

```javascript
select when repeat 3 (E)
```

The arrows on the event stream in the following diagram show where this eventex would match.

![Fig03-04.png](/krl/_media/1189886-Fig03-04.png)
 The repeat operator is not particularly interesting by itself, but is mostly used in concert with [aggregators](/krl/event-expressions/compound-events/aggregators) introduced in the next section.

## Time Bounds

You can use relative time bounds with group operators, as shown in the following example:

```javascript
select when any 2 (web pageview url re#customer_support.html#,
                   phone inbound_call to re#801-649-4069#,
                   email received subject re#\[help\]#)
             within 3 minutes
```

This event expression has the same semantics as the `any` example given earlier, except the matches of the subexpressions must occur within three minutes.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189886) (last edited there 2017-06-05).</small>
