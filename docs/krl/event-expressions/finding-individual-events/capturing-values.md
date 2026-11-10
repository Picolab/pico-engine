# Capturing Values

[Regular expressions](/krl/krl-expression-language/literals/regular-expressions) inside an eventex can be used to capture values and assign them to a variable for later use. You indicate that you want to capture a value in a regex by enclosing the part of the pattern you wish to capture in parentheses. Event expressions can use an optional setting clause to indicate the variable names for any captured values. Values are assigned to named variables in the order the captures appear in the regexes.

The following eventex would select the same events as the one in the preceding example, but also capture the digits of the archive path from the URL and the value of the word following "iphone" in the title:

```javascript
select when web pageview url re#/archives/(\d{4})/# title re#iphone (\w*)#i setting(year, next)
```

Suppose the actual event is a page view on the path `/archives/2005/` with the page title "Singing the iPhone Blues." When the given eventex matches such an event, the variable `year` will contain the value `2005` and the variable `next` will contain the value `Blues`.

As another example, consider the following eventex that sets the variable `user_id` from the "from" address in an incoming email message:

```javascript
select when mail received from re#(.*)@windley.com# setting(user_id)
```

The ability to select events not just by type and domain, but also by regex matches against their individual attributes along with binding part or all of the matching values to variables, provides a powerful means of selecting events from the event stream.

When you need to use parentheses for grouping inside a regular expression but don't wish to capture the value, you can add `?:` to the front of the grouping:

```javascript
select when web pageview url re#/(?:archives|logs)/(\d+)/(\d+)/# setting (year, month)
```

The `?:` inside the first expression in parentheses keeps that match from being captured so that the year and month are still set correctly. If you capture more values than you have variables in the setting clause, the extra captured values will be ignored.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189867) (last edited there 2017-07-10).</small>
