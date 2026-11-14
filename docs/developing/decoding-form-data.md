# Decoding form-encoded data

Form-encoded content, such as `q=5&value=%20space%20`, sometimes arrives as a single string: in a webhook body, a stored URL, or a query string you built. A chain of operators turns it into a map.

## Names and values

```krl
nv_split = function(x) { x.extract(re#([^=]*)=?(.*)#) }  // "n=v" -> ["n", "v"]
frst = function(a) { a.head() }
dup_1st = function(v) { v[0][1] }

decodeContent = function(content) {
  content            // "n0=v0&n1=v1&..."
    .split(re#&#)    // ["n0=v0", "n1=v1", ...]
    .map(nv_split)   // [["n0", "v0"], ["n1", "v1"], ...]
    .collect(frst)   // {"n0": [["n0", "v0"]], "n1": [["n1", "v1"]], ...}
    .map(dup_1st)    // {"n0": "v0", "n1": "v1", ...}
}
```

`decodeContent("q=5&value=%20space%20")` is `{"q": "5", "value": "%20space%20"}`.

- `split` makes an array of `name=value` strings.
- `extract` matches each one against a regular expression and returns its capture groups, the name and the value.
- `collect` groups the pairs into a map keyed by name. Each value is an array of every pair with that name.
- The map operator `map` keeps the first value for each name.

## Keep every value of a repeated name

When a name can repeat, keep all its values:

```krl
dup_all = function(v) {
  v.length() == 1 => v[0][1] | v.map(function(w) { w[1] })
}
```

Use `.map(dup_all)` in place of `.map(dup_1st)`. `a=1&a=2&b=3` becomes `{"a": ["1", "2"], "b": "3"}`.

## Decode `+` and `%xx`

`replace` accepts a function as its second argument. It is called with the match and then each capture group, and returns the replacement:

```krl
hexDigits = "0123456789abcdef"

hex2dec = function(hex) {
  hex like re#^[0-9A-Fa-f]+$#
    => hex.lc().split("").reduce(function(a, h) { a * 16 + hexDigits.split("").index(h) }, 0)
    | null
}

hex2char = function(encoded, hex) {
  val = hex2dec(hex)
  val && val < 128 => val.chr() | encoded
}

decode_val = function(s) {
  s.replace(re#[+]#g, " ").replace(re#%([0-9A-Fa-f]{2})#g, hex2char)
}
```

Replace `+` first: early encoders used it for a space, and a real plus sign arrives as `%2B`. Then use `function(v) { decode_val(v[0][1]) }` as the last step of the chain. `value=%20space%20&plus=a%2Bb&pct=100%25` becomes `{"value": " space ", "plus": "a+b", "pct": "100%"}`. This handles ASCII characters. Anything above 127 is left encoded.

Events and queries that arrive over HTTP are already decoded: the engine gives you their attributes as a map. This is for strings you have in hand.

*From the Pico Labs KRL Cookbook page "Decoding WWW-Form Encoded Content or Query Parameters".*
