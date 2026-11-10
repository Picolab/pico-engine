# query()

> **Engine Compatibility:**
>
> The `query()` operator is not supported by the new pico engine.

The `query()` operator can be used to search structured persistent variables. The syntax is

```javascript
<persistent variable>.query(<hash path>, {
  'requires' : <join operator>,
  'conditions : [
     { 'search_key' : <path_to_field>,
       'operator' : <mongo $ comparison op>,
       'value' : <value> },
     ...
  ]
  },| <extended result>
  );
```

`<hash path>` will be the empty array, `[]`, if the key is at root.

`search_key` is the path from the `<hash path>` to the field that you want to compare.  If that path does not exist for an entry, it will not be considered even as a `null`

The operation is to search the given path in each value in the hash for those that meet the comparison test given by the operator and value. Multiple conditions can be given and they are joined using with a $and or $or.

For example to do a twitter timeline search where the entries have been assigned a unique key to transform the array into a hash:

```javascript
ent:tweets.query([],{
  'requires' :  '$and',
  'conditions'   : [
    {
      'search_key' : ['retweeted_status', 'favorite_count'],
      'operator' : '$gt',
      'value' : 5
    },
    {
      'search_key' : ['retweeted_status', 'favorite_count'],
      'operator' : '$lt',
      'value' : 200
    }
  ]})
```

This will return an array of &lt;hash paths> (array of arrays) that is essentially an array of the keys to the matching values

```javascript
[
   [     'a32'   ],
   [     'a31'   ],
   [     'a30'   ]
]
```

You can then use the values to get the entire element with `ent:tweets``{[ 'a32' ]}.`

 if the third argument to `query()` is not null, the actual result, rather than a path to it will be returned.

The following function from Fuse uses `query()` to return trips by their end date, given a start and end date.

```javascript
trips = function(start, end){
  utc_start = common:convertToUTC(start);
  utc_end = common:convertToUTC(end);

  ent:trip_summaries.query([],
      {
       'requires' : '$and',
       'conditions' : [
          {
     	   'search_key' : [ 'endWaypoint', 'timestamp'],
       	   'operator' : '$gte',
       	   'value' : utc_start
	      },
     	  {
       	   'search_key' : [ 'endWaypoint', 'timestamp' ],
       	   'operator' : '$lte',
       	   'value' : utc_end
	      }
	   ]},
	"return_values"
  )
};
```

Note that KRL stores data in persistent variables in a "flat format" and therefore, all comparisons are string or numeric comparisons. The query() operator doesn't know about dateTime and other special formats for values.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189597) (last edited there 2017-06-08).</small>
