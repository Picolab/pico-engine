# CSV

The CSV library converts between arrays of maps and comma-separated values ([RFC 4180](https://www.rfc-editor.org/rfc/rfc4180)).

## Functions

### from_array

`csv:from_array(<entry array>, <field array>)`

Formats a CSV string from an array of maps. The first line holds the field names, and each map becomes one line after it.

The field array is optional. Without it, the columns are every key that appears in the maps, in the order they first appear. A map missing a field gets an empty value.

A value that contains a comma, a double quote, a line break, or leading or trailing spaces is put in double quotes, and any double quotes in it are doubled. `null` becomes an empty value, and maps and arrays are written as JSON. Lines end in a newline (`\n`).

#### Examples

```krl
data = [
  {
    "name": "school",
    "cost": "2.02",
    "startWaypoint": "-111.712441, 40.332897",
    "mileage": "8.7",
    "category": "business"
  },
  {
    "cost": "0.63",
    "name": "shopping",
    "startWaypoint": "-111.687001, 40.334647",
    "mileage": "2.7",
    "category": ""
  }
]
csv = csv:from_array(data)

// name,cost,startWaypoint,mileage,category
// school,2.02,"-111.712441, 40.332897",8.7,business
// shopping,0.63,"-111.687001, 40.334647",2.7,
```

The columns follow the keys of the first map, even though the second map lists them in a different order.

This example uses the same data but specifies the fields:

```krl
csv = csv:from_array(data, ["category", "name"])

// category,name
// business,school
// ,shopping
```

Only the fields given are returned, in the order given.

### to_array

`csv:to_array(<csv string>)`

Reads CSV text into an array of maps. The first line holds the field names. Quoted values may contain commas, doubled quotes, and line breaks. Lines may end in `\n` or `\r\n`, and blank lines are skipped. Every value is a string; a line with fewer values than fields gets empty strings for the rest.

```krl
rows = csv:to_array(http:get(url){"content"})
total = rows.map(function(r) { r{"cost"}.as("Number") })
            .reduce(function(a, b) { a + b }, 0)
```

`csv:to_array` reads what `csv:from_array` writes, except that values come back as strings.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1182574) (last edited there 2017-07-10).</small>
