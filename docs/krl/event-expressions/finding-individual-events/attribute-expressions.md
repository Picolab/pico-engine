# Attribute Expressions

As powerful as [regular expression](/krl/krl-expression-language/literals/regular-expressions) matching is, there are times when you need a more freeform expression to precisely select the events in which you are interested. Instead of following the eventex type with a [series of attribute-regex pairs](/krl/event-expressions/compound-events/event-operators) to match attributes, the type can be followed with a single [expression](/krl/krl-expression-language/). If the type and domain match *and the expression's value is true*, then the eventex matches. Such expressions actually have the full power of expressions. Attribute names cannot be used as variables in the expression; be careful to remember that event attribute values must be obtained using the `event:attr` function.

Attribute expressions are introduced to a primitive eventex with the `where` keyword. For example, the following two eventexes mean the same thing:

```javascript
select when web pageview where event:attr("url").match(re#/archives/\d{4}/#)
select when web pageview url re#/archives/\d{4}/#
```

But suppose you only want to match events when the year in the archive path of the URL is greater than 2003? You could express that using regexes, but it gets messy. The following eventex accomplishes that easily:

```javascript
select when web pageview where event:attr("url").extract(re#/archives/(\d{4})/#).head() > 2003
```

The `extract()` operator in this expression returns an array of matches in the regex. The `head()` operator returns the first element in the array for use in the inequality test.

While only a single attribute expression can be used in a primitive eventex, you can use Boolean operators to test scenarios that are more complex. The following eventex not only matches articles after 2003 but also requires that the title contain the string "Utah":

```javascript
select when web pageview where event:attr("url").extract(re#/archives/(\d{4})/#).head() > 2003 &&
                           event:attr("title").match("Utah")
```

Attribute expressions provide a powerful and flexible way to match individual events.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189888) (last edited there 2018-02-13).</small>
