# URI

> **Engine Compatibility:**
>
> This library has not yet been ported to the New Pico Engine

The URI module is used to escape and unescape strings to/from a URI acceptable format (replacing spaces with '%20' for example).

### Escape

```javascript
escaped = uri:escape("This is a test"); // Returns 'This%20is%20a%20test'
```

### Unescape

```javascript
 unescaped = uri:unescape("This%20is%20a%20test"); // Returns 'This is a test'
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1183696) (last edited there 2017-02-17).</small>
