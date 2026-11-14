# Importing tables and CSV

Data exported from a spreadsheet or another system usually arrives as text: tab-separated (TSV) or comma-separated (CSV) lines. If the other system can export JSON, use that instead. `decode()` turns a JSON string into KRL data in one step.

## Lines

Exports end lines with `\n` or, from Windows, `\r\n`. One regular expression handles both:

```krl
lineBreak = re#\r?\n#
lines = content.split(lineBreak).filter(function(s) { s })
```

`filter(function(s) { s })` drops empty lines: an empty string is falsy, and there is usually one after the last line break. Another way is to let a global regular expression find the lines: `content.extract(re#(.+)#g)`.

## A table to an array of maps

When the first row names the columns, make each data row a map:

```krl
tsv = function(content) {
  lines = content.split(re#\r?\n#).filter(function(s) { s })
  keys = lines.head().split(re#\t#)
  lines.tail().map(function(line) {
    values = line.split(re#\t#)
    keys.reduce(function(m, k, i) { m.put(k, values[i]) }, {})
  })
}
```

Given

```
A	B
1	2
3	4
```

`tsv(content)` is `[{"A": "1", "B": "2"}, {"A": "3", "B": "4"}]`. The `reduce` passes each key's index as its third argument, which picks the matching value.

## CSV with a known shape

CSV is harder, because a value that contains a comma is wrapped in double quotes. When you know what each line looks like, match the whole line with a regular expression and let the last group take the rest:

```krl
graduands = function(content) {
  content.extract(re#(.+)#g)
    .tail()
    .map(function(line) { line.extract(re#^([\w ]+),(\w+),(\d+),(\d+),(.*)$#) })
}
```

`Ada Lovelace,AL,1,1843,"Notes, on the engine"` becomes `["Ada Lovelace", "AL", "1", "1843", "\"Notes, on the engine\""]`. Strip the quotes from that last field if you need to. `tail()` skips the header line.

## Fetch the file

Rather than passing a whole file to a function, give it a URL:

```krl
import = function(url) {
  tsv(http:get(url){"content"})
}
```

A function that calls `http:get` runs on every query, so for a large file, import it once in a rule and store the result in an entity variable.

*From the Pico Labs KRL Cookbook pages "Converting a table to an Array of Maps" and "Importing data from other systems".*
