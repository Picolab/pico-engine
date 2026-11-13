# rss

The rss library reads RSS 2.0, RSS 1.0 (RDF), and Atom feeds.

Every function takes the feed as its first argument, in any of these forms:

- a parsed feed, from `rss:parse`
- the feed's XML text
- an `http:get` response holding the feed (its `content` is the XML)

Each call parses text or a response again, so when a rule uses several functions, call `rss:parse` once in the prelude and pass the result.

```krl
pre {
  feed = rss:parse(http:get("https://www.windley.com/rss.xml"))
  title = rss:channel(feed, "title")
  latest = rss:first(feed)
}
```

## The parsed feed

`rss:parse` returns a map:

```krl
{
  "version": "2.0",            // "2.0" (or the version the feed gives), "1.0", or "atom"
  "channel": { "title": …, "link": …, "description": …, … },
  "items": [ { "title": …, "link": …, "description": …, "guid": …, "pubDate": …, … }, … ]
}
```

The channel and each item hold their elements by name. An element with text gives its text (CDATA included); an element with only attributes, such as `<enclosure url="…" type="…"/>`, gives a map of them; and a repeated element, such as `category`, gives an array. Elements with a namespace prefix keep it: `item{"dc:creator"}`, `item{"content:encoded"}`.

For Atom feeds the names match RSS where they can: the channel's `link` is the feed's page and `description` its subtitle, and each entry's `link` is its page, `guid` its `id`, `description` its summary (or content), and `pubDate` its published (or updated) time. The Atom names are there too.

## Feed functions

### parse

`rss:parse(feed)` returns the parsed feed. It raises an error for text that isn't an RSS or Atom feed.

### version

`rss:version(feed)` returns the feed's version: the `version` of an `<rss>` feed (usually `"2.0"`), `"1.0"` for RDF, or `"atom"`.

## Channel functions

### items

`rss:items(feed)` returns the array of items.

### first

`rss:first(feed)` returns the first item, or `null` if there are none.

### last

`rss:last(feed)` returns the last item, or `null`.

### index

`rss:index(feed, n)` returns the nth item, counting from 1, or `null` if there is no such item.

```krl
third = rss:index(feed, 3)
```

### random

`rss:random(feed)` returns a random item, or `null`.

### channel

`rss:channel(feed, name)` returns the named channel element, or `null`. Without a name it returns the whole channel map.

```krl
title = rss:channel(feed, "title")
```

## Item functions

### item

`rss:item(item, name)` returns the named element of an item, or `null`. It's the same as `item{name}`.

```krl
headlines = rss:items(feed).map(function(i) { rss:item(i, "title") })
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189836) (last edited there 2017-02-17).</small>
