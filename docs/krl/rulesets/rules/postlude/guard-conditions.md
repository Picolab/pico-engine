# Guard Conditions

Any statement in a postlude can have an optional guard condition. There are two types of guard conditions: `if` and `on final`.

## If

The `if` guard condition ensures that the postlude statement will only fire if the predicate in the guard is true.

The syntax is

```javascript
<postlude_statement> if <predicate_expression>
```

For example:

```javascript
fired {
 ent:page_count := ent:page_count + 2 if sunny()
}
```

## On Final

The `on final` guard condition ensures that the postlude statement will only fire on the final time through the rule. Normally `on final` is used inside a `foreach` loop.

The syntax is

```javascript
<postlude_statement> on final
```

Rules often raise explicit events in the postlude to signal other rules that they are finished and to indicate their exit state. Usually, a rule only wants to raise such an even once, even if the rule has a `foreach`statement. For example:

```javascript
rule show_tweets {
  select when explicit populate
     foreach tweet_list setting (tweet)
       pre {
         ...
       }
       append(...)
       fired {
         raise explicit event "tweets_shown" on final
       }
}
```

In the preceding example, the rule will execute once for each of the tweets in the tweet list, but the explicite event `tweets_shown` will only be raised once on the final time through the rule.

The `on final` guard condition works even when `foreach` loops are nested.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189887) (last edited there 2017-07-25).</small>
