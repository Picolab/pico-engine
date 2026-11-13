# URI

The URI library escapes strings for use in a URI and unescapes them again: a space becomes `%20`, for example. It escapes everything except letters, digits, and `- _ . ! ~ * ' ( )`, so an escaped value is safe in a path segment or a query parameter.

### escape

```krl
escaped = uri:escape("This is a test") // "This%20is%20a%20test"
q = uri:escape("a&b=c")                // "a%26b%3Dc"
```

### unescape

```krl
unescaped = uri:unescape("This%20is%20a%20test") // "This is a test"
```

`uri:unescape` raises an error if the string has a malformed escape, such as a `%` not followed by two hex digits.

To build a query string from a map, `http:get` and `http:post` take a `qs` argument that escapes for you.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1183696) (last edited there 2017-02-17).</small>
