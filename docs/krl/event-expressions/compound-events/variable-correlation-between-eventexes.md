# Variable Correlation Between Eventexes

You've seen that the `setting` clause can be used to capture values in regular expressions and bind them to variables in primitive events. When a value is bound to a variable, it can be used in subsequent subexpressions in the same eventex. (To be less ambiguous, variables bound in one eventex can be used in enclosing eventexes. Parentheses can be used to ensure that the nesting of event subexpressions is what the developer desires.) For example, suppose you want to see if someone has viewed the same page twice without having to specify the page. You don't care which page they view, as long as they view it twice.

```javascript
select when web pageview url re#/archives/(.*)# setting (a)
     before web pageview where event:attr("url").match(("#/archives/"+a+"#").as("RegExp"))
```

This eventex takes advantage of the expression language's type coercion operator, `as`, to construct a string using the value from the first eventex and then turn it into a regex for the second match.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189881) (last edited there 2018-02-13).</small>
