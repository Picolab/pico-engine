# CSV

The CSV library provides functions related to comma separated values.

> **Engine Compatibility:**
>
> This library has not yet been ported to the Node Pico Engine

## Functions

`csv:from_array(<entry array>, <field array>)`

Formats a CSV string from and array of maps.

This function takes an array of maps representing the entries to be formatted and an array with the desired fields.

If the field array is missing, all the fields in the maps will be returned.

The function assumes that each of the maps in the array have the same keys.

#### Examples

```javascript
data = [{
		  "startWaypoint": "-111.712441, 40.332897",
          "cost": "2.02",
          "name": "school",
          "interval": 1372,
          "mileage": "8.7",
          "endWaypoint": "-111.658318, 40.251986",
		  "endTime": "20140829T143628+0000",
          "avgSpeed": "22.8",
          "startTime": "20140829T141336+0000",
          "category": "business"
       },
       {
          "cost": "0.63",
          "startWaypoint": "-111.687001, 40.334647",
          "name": "shopping",
          "interval": 734,
          "mileage": "2.7",
          "endWaypoint": "-111.71217, 40.332837",
	      "endTime": "20140829T132710+0000",
          "avgSpeed": "13.2",
          "startTime": "20140829T131456+0000",
          "category": ""
      }]
csv = csv:from_array(data)

// cost,startWaypoint,name,interval,mileage,endWaypoint,endTime,avgSpeed,category,startTime
// 2.02,"-111.712441, 40.332897",school,1372,8.7,"-111.658318, 40.251986",20140829T143628+0000,22.8,business,20140829T141336+0000
// 0.63,"-111.687001, 40.334647",shopping,734,2.7,"-111.71217, 40.332837",20140829T132710+0000,13.2,,20140829T131456+0000
```

Note that the order is the same regardless of the order of the keys in the maps. If you do not specify a field array, the order of the columns will be random.

This example uses the same data, but specifies fields.

```javascript
csv = csv:from_array(data, ["endTime","category"])

// endTime,category
// 20140829T143628+0000,business
// 20140829T132710+0000,
```

In this case, only the fields specified are returned and in the specified order.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1182574) (last edited there 2017-07-10).</small>
