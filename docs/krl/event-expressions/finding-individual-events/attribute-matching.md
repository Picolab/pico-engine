# Attribute Matching

When exact matches aren't enough, the next step in expressive power is garnered through attribute matching. Eventexes for attribute matching are formulated in the same way as exact matching eventexes, adding as many attribute-regex pairs as needed to specify the precise events that should match.

The following eventex matches a `pageview` event and applies a regex to the event attribute `url`:

```javascript
select when web pageview url re#/archives/\d{4}#
```

This pattern will match all events in the event stream that contain an attribute named `url` that has a value that contains the string `/archives/` followed by four digits. This particular event would indicate that the user has viewed a Web page that has a URL matching the regex.

You can test more than one attribute by simply including them in the eventex. Multiple attribute-regex pairs are evaluated. All of them must be true for the event expressions to match. For example:

```javascript
select when web pageview url re#/archives/\d{4}/#  title re#iphone#i
```

This represents a subset of the events selected by the preceding eventex to include only those from the archive path that contain the word "iphone" in the title of the page. The trailing `i` in the regex indicates that case shouldn't be taken into consideration in matching the title.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189864) (last edited there 2017-06-05).</small>
