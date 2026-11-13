# Looping in Rules

When dealing with data, iteration is important. KRL supports implicit and explicit looping:

- First, recognize that the entire ruleset can be seen as a big if-statement looping over the event stream. Seeing event processing as a looping process helps design efficient, effective rulesets.
- Many of the [array](/krl/krl-expression-language/operators/array-operators) and [map operators](/krl/krl-expression-language/operators/map-operators) like map() and filter() loop over data.
- In addition to these implicit forms of looping, [KRL functions](/krl/krl-expression-language/functions/) support recursion and thus can be used to iterate over arguments.

But with all that, we sometimes need explicit loops. KRL loops are a little different than what your previous programming experience might lead you to expect. The KRL `foreach` statement can only appear just below the `select` statement like so:

```javascript
select when wovyn new_temperature
  foreach [1, 2, 3] setting (x,i)
```

The `foreach` statement Is an iterator. This statement would execute the entire rule three times with the variable `x` bound to 1, 2, and 3 in each successive execution. A second name is optional in the `setting` clause. Here, the name `i` will be bound to the index of each array element, i.e. 0, 1, and 2 in each successive execution.

The value following the keyword `foreach` can be any KRL expression that yields an array or map.  If the variable `f` were an array, you could loop over the `f` like so:

```javascript
select when web pageview url re#archives#
  foreach f setting (x)
```

To use the `foreach` statement with a map, you provide two variables in the `setting` clause that will be bound the name and value of that entry in the map:

```javascript
select when web pageview url re#archives#
  foreach {"a" : 1, "b" : 2, "c" : 3} setting (v,n)
```

This would bind `a`, `b`, and `c` to `n` along with 1, 2, and 3 to `v` on each successive iteration through the loop.

You can have more than one loop in a rule by simply nesting one `foreach` inside another:

```javascript
select when web pageview url re#archives#
  foreach [1, 2, 3] setting (x)
    foreach ["a", "b", "c"] setting (y)
```

As you’d expect, this would bind `a`, `b`, and `c` to `y` while `x` is 1, and then bind `a`, `b`, and `c` to `y` while `x` is 2, and so on.  Since values being iterated over can be computed, you could use `x` in computing the array for the second loop.

At first it may seem restrictive to only be able to loop at the start of a rule, but it fits the rule model very nicely.  Because of their structure, rules in KRL become what are called [FLWOR](http://en.wikipedia.org/wiki/FLWOR) (pronounced “flower”) statements. FLWOR is an acronym for “Foreach, Let, Where, Order, Result.” The following table shows which KRL rule features plays which part in creating FLWOR statements.

Comparison of FLWOR and KRL

| FLWOR | KRL |
| --- | --- |
| Foreach | Foreach |
| Let | Prelude |
| Where | Rule condition |
| Order | Array filters and operations |
| Result | Action |

The entire rule body—everything after the `select`—is executed once for every loop. If the rule condition is true, an action is produced, so a rule with a `foreach` over a three-element array would produce three actions if the condition were true each time. (Note: KRL optimizes rule preludes by automatically moving expressions that don’t depend on the variable being set in the foreach statement outside the loop during execution so that only those things that really need to be executed multiple times are.)

There is also a [guard condition](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189887/Guard+Conditions) called "on final" that will allow you to execute a postlude statement only on the last iteration of the foreach.

## When to Use a Loop

> **Engine Compatibility:**
>
> Much of the example code in this section needs to be rewritten; it uses deprecated features like pick() and page:url() only found in the classic pico engine. In this engine, [`query()`](/krl/krl-expression-language/operators/query-operator) does what `pick()` did, but always returns an array. But, the idea of using a filter instead of a loop is still valid.

Your instincts might be to use foreach loops in places where it’s less efficient than using implicit looping. To see when you might want to use a JPex instead of a foreach statement let’s walk through an example.

Suppose that you have a data set that lists a number of sites by URL and gives some data about each of them. Further, suppose you’d like to annotate sites with the data out of the dataset when the URL matches so that you don’t have to republish the ruleset each time it changes.

While this kind of data would generally be generated, let’s just declare it, in a variable named items, in the global:

```javascript
global {
  items = [{page: "baconsalt.com"
            content: "Hello World. Go Bacon."
            header: "Bacon Salt Test"
           },
           {page: "craigburton.com"
            content: "Hello World. Burtonian methods."
            header: "Craig Burton Test"
           },
           {page: "kynetx.com"
            content: "Hello World. The World According to Kynetx"
            header: "Kynetx Test"
           }]
}
```

Using this data, we want to place a notification box on any of the three sites listed in the page field. The notification uses the content and header data out of the dataset for any give page.

Your first attempt, using `foreach` might look something like this:

```javascript
rule using_foreach {
   select when web pageview url ".*"
      foreach items setting (d)
      pre {
         h = d.pick("$.header") + " using foreach";
         c = d.pick("$.content");
         domain = page:url("domain");
      }
      if(domain eq d.pick("$.page")) then
        notify(h,c);
 }
```

This does the job, looping through each item (binding its value to `d`) and using the premise of the rule to check that the current domain is applicable before placing the notification.

The problem is that this rule is quite inefficient. We’re looping through the data and throwing all the work away in all but one case (where the domain name matches the site we’re on).  For three items, this isn’t a big problem, but what if the data set contained information for thousands of sites? We’d be wasting a lot of processing time. There are two ways to solve this problem.

The first is to use the full power of array [filters](/krl/krl-expression-language/operators/array-operators) to cut the array down to just those members meeting the desired criterion:

```javascript
rule using_foreach_with_filter {
   select when web pageview url ".*"
      foreach items.filter(
               function(x) {page:url("domain") eq
                            x.pick("$.page")})
         setting (d)
      pre {
         h = d.pick("$.header") + " using foreach";
         c = d.pick("$.content");
         domain = page:url("domain");
      }
      if(domain eq d.pick("$.page")) then
        notify(h,c);
 }
```

The anonymous function in the `filter()` operator compares the page in its argument to the domain of the page the rule is running against. You could also define this function earlier in the global block and just give its name as an argument to filter.

In this rule, the array will be filtered to only those items that have a page name that matches the domain of the current page. For our example, that would be an array of one. Consequently, the `foreach` isn’t really looping, it’s running once. This points us to the second way of making our rule more efficient: don’t use a `foreach` statement at all.

In the following rule, we use the implicit looping and filtering capabilities of a JPex to find just the item we want from the data structure and then pick the pieces we need out of that one item.

```javascript
rule without_foreach {
   select when web pageview url ".*"
   pre {
     dom = page:url("domain");
     item = site_data.pick(
            "$..items[?(@.page eq '"+dom+"')]");
     content = item.pick("$..content");
     header = item.pick("$..header")
        + " without foreach";
   }
   if(dom eq item.pick("$..page")) then
     notify(header,content);
}
```

This rule uses the domain in constructing the JPex to select the right element of the array of items. The JPex is the secret to how the above rule works: the JPex does an implicit loop over the data and only selects the items where page matches the domain. Consequently, we don’t need the `foreach`.

## Loops Drive Multiple Actions

As we’ve seen, `foreach` causes the same rule to be fired multiple times in a single ruleset evaluation. Some actions are better suited to use inside a `foreach` loop than others. For example, issuing multiple [redirect()](https://picolabs.atlassian.net/wiki/display/docs/%28Classic%29+redirect%28%29) actions from a single rule doesn’t usually make sense. But other actions like [append()](https://picolabs.atlassian.net/wiki/display/docs/%28Classic%29+append%28%29), [replace()](https://picolabs.atlassian.net/wiki/display/docs/%28Classic%29+replace%28%29), [send_directive()](/krl/rulesets/rules/actions/taking-action/send-directive), and so on are often done over and over with different data. An example illustrates this idea.

Suppose we wanted to make changes to a page based on data we retrieved from an online datasource. Assume the datasource returns data like the following and we bind it to a variable named `replacements`:

```javascript
{"desc": "Data set to test foreach",
 "replacements": [
     {"selector":"#categories",
      "text":"This was the cloud tag"
     },
     {"selector":"#friends",
      "text":"This was a list of friends"
     },
     {"selector":".action-stream",
      "text":"This is where the action stream was"
     }
    ]
}
```

In this dataset, we have an array of replacements, each of which contains a jQuery selector pattern for elements on a Web page and the text we’re going to use with the action. The following ruleset uses the items in this data structure to prepend the text in each item above to the element on the page that matches the associated selector pattern:

```javascript
rule prepend {
   select when web pageview where url == "windley.com"
     foreach replacements.pick("$.replacements")
             setting (r)
     pre {
       sel = r.pick("$.selector");
       new_text = r.pick("$.text");
     }
     prepend(sel,new_text);
}
```

This changes the same page multiple times according to the content of the data structure. Change the data and the behavior of the rule will follow.

Using data often requires loops. We'v seen that there are multiple ways to loop in KRL: a ruleset is a loop, each rule can loop explicitly using foreach, and implicit looping is accomplished using operators like [map()](/krl/krl-expression-language/operators/array-operators) and [filter()](/krl/krl-expression-language/operators/array-operators).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189917) (last edited there 2019-12-27).</small>
