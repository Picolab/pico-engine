# rss

## The RSS Library

> **Engine Compatibility:**
>
> This library has not yet been ported to the New Pico Engine

The Kynetx Rule Language has native support for handling and processing RSS feeds.  The KRL convenience functions can be grouped into feed, channel and item functions.

## Feed Functions

### version

The rss:version() function returns the version of the rss feed.  The rss:version() function takes in the following arguments:

- **Dataset or Datasource**—An rss dataset or datasource

The following is an example of rss:version

```javascript
pre {
  rssVersion = rss:version(rss_data_set);
}
```

## Channel Functions

### items

the rss:items() function returns an array of all the RSS items in the feed. The rss:items function takes in the following arguments:

- **Dataset or Datasource**—An rss dataset or datasource

The following is an example of rss:items()

```javascript
pre {
  rssItems = rss:items(rss_data_set);
}
```

### first

the [rss:first()](http://rssitems()) function returns the first item from the channel feed. The rss:first function takes in the following arguments:

- **Dataset or Datasource**—An rss dataset or datasource

The following is an example of [rss:items()](http://rssitems())

```javascript
pre {
  rssFirstItem = rss:first(rss_data_set);
}
```

### last

the [rss:last()](http://rssitems%28%29/) function returns the last item from the channel feed.  The rss:last function takes in the following arguments:

- **Dataset or Datasource**—An rss dataset or datasource

The following is an example of [rss:last()](http://rssitems%28%29/)

```javascript
pre {
  rssLastItem = rss:last(rss_data_set);
}
```

### index

The [rss:index()](http://rssitems%28%29/) function returns the nth item from the feed.  The rss:index function takes in the following arguments:

- **Dataset or Datasource**—An rss dataset or datasource
- **n—**The item number desired

The following is an example of [rss:index()](http://rssitems%28%29/)

```javascript
pre {
  rssThirdItem = rss:index(rss_data_set, 3);
}
```

### random

The [rss:random()](http://rssitems%28%29/) function returns a random item from the feed. The rss:random function takes in the following arguments:

- **Dataset or Datasource**—An rss dataset or datasource

The following is an example of [rss:random()](http://rssitems%28%29/)

```javascript
pre {
  rssRandomItem = rss:random(rss_data_set);
}
```

### channel

The [rss:channel()](http://rssitems%28%29/) function returns values from the various channel elements. The rss:channel function takes in the following arguments:

- **Dataset or Datasource**—An rss dataset or datasource
- **name—**The name of the desired element

The following is an example of [rss:channel()](http://rssitems%28%29/)

```javascript
pre {
  rssChannelTitle = rss:channel(rss_data_set, "title");
}
```

## Item Functions

### item

The rss:item() function returns the desired rss item

- **Dataset or Datasource—**An rss dataset or datasource
- **name---**the name of the desired element

The following is an example of [rss:item()](http://rssitems%28%29/)

```javascript
pre {
  rssTitle = rss:item(rss_data_set, "title");
}
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189836) (last edited there 2017-02-17).</small>
