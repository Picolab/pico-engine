# Regular Expressions

Regular expressions are enclosed in matching pound sign (`#`) characters with a prepended `re`: `re#...#`. KRL [regular expressions](http://www.regular-expressions.info/javascript.html) follow the [JavaScript standard](https://www.ecma-international.org/ecma-262/5.1/#sec-15.10), which closely follows the conventions for [Perl regular expressions](http://perldoc.perl.org/perlretut.html). The following modifiers may appear in any order after the closing character:

- **`i`.** The i modifier makes the regular expression case insensitive.
- **`g`.** The g modifier applies the regular expression globally.

For example, the following code replaces the first instance of `foo` in `p` with `bar`:

```javascript
p.replace(re#foo#, "bar")
```

In contrast, the following code replaces all instances of `foo` in `p` with `bar`:

```javascript
p.replace(re#foo#g, "bar")
```

## Special characters

Like strings, the only special characters are the terminator (`#`) and the backslash (`/`). To use pound signs or backslashes inside regular expressions, escape them with backslashes:

```javascript
re#\#\\# // '#' followed by '\'
```

A newline (\n) requires a line break:

```javascript
re#
#
```

Other characters can be inserted literally (some text editors are better at this than others), or consider using [chr()](https://picolabs.atlassian.net/wiki/display/docs/Number+Operators#NumberOperators-chr()) and [converting the string to a regular expression](https://picolabs.atlassian.net/wiki/display/docs/Universal+Operators#UniversalOperators-as()).

## Rationale

KRL uses the hash character to delimit regular expressions instead of the more common (and acceptable) slash (`/`) because the slash is a frequently used character in URL paths. This removes the need to quote the slash with backslashes: `re/\/archives\/\d{4}\//`. Using an alternate delimiter makes the regex more readable and thus communicates its meaning more clearly: `re#/archives/\d{4}/#`.

## Samples

Some regular expressions found in KRL code "in the wild".

### timestamp

```
select when d1 t1 time re#^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.]\d{3}Z)$# setting(timestamp)
```

The regular expression above matches a string such as produced by the `time:now()` function in the [time library](/krl/libraries/time). Notice that it expects the string to consist entirely, from beginning (^) to end ($) of an ISO8601 time string and furthermore, that string is [captured](/krl/event-expressions/finding-individual-events/capturing-values) (note the surrounding pair of parentheses). In this context, a rule controlled by the [event expression](/krl/event-expressions/finding-individual-events/attribute-matching) shown above would be selected when an incoming event had domain `d1`, type `t1`, and an event attribute named "`time`" which satisfied the ISO8601 pattern specified by the regular expression. Within the rest of the rule the validated value will be available as the value bound to the name `timestamp`.

### ECI

```
re#^[A-Za-z0-9]{21,22}$#
```

The regular expression above matches an [event channel identifier](https://picolabs.atlassian.net/wiki/display/docs/Event+Channels), which in the Node.js [pico engine](https://github.com/Picolab/pico-engine) is a [distributed identifier or DID](https://w3c-ccg.github.io/did-spec/).

### non-negative integer

```
re#^(\d+)$#
```

### non-empty string of characters

```
re#(.+)#
```

### a literal decimal point

```
re#[.]#
```

This appeared in a function to compute the integer part of a non-negative value which might contain a decimal point:

```
      math_int = function(num) {
        val = num.as("String");
        dec = val.match(re#[.]#);
        dec => val.extract(re#(\d*)[.]\d*#)[0].as("Number") | num;
      }
...
      tens = math_int( x / 10 )
```

The function uses the [string operator extract](/krl/krl-expression-language/operators/string-operators) to isolate the numerator from the number computed as `x / 10`.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189868) (last edited there 2018-07-19).</small>
