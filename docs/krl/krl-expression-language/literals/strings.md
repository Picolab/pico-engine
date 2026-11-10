# Strings

Strings are created by enclosing Unicode characters in double quotes. Strings are UTF-8 encoded. The empty string is falsey.

## Special characters

The only special character is `"`. You can put a double quote inside a string by escaping it with a backslash:

```
a = "I can put a quote character, \", in my string using a backslash"
```

A backslash is escaped with another one:

```
b = "I can end my string with a \\"
```

A newline (\n) requires a line break:

```
c = "And include a '
' too!"
```

Other characters can be inserted literally (some text editors are better at this than others), or consider using [chr()](https://picolabs.atlassian.net/wiki/display/docs/Number+Operators#NumberOperators-chr()).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189875) (last edited there 2019-04-04).</small>
