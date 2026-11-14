# Converting time formats

The [time library](/krl/libraries/time) works with ISO 8601 / RFC 3339 times such as `2011-09-21T15:02:01-07:00`. Other formats need converting first. RSS feeds, for example, give dates like `Wed, 21 Sep 2011 15:02:01 -0700` (RFC 2822), and `time:new` rejects them: `time:new was given an invalid date string`.

This function rearranges the parts:

```krl
mon2num = {
  "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06",
  "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
}

rss2krlTime = function(pubDate) {
  tarr = pubDate.split(re# #)
  tzoff = tarr[5].replace(re#(\d\d)$#, ":$1")
  tarr[3] + "-" + mon2num{tarr[2]} + "-" + tarr[1] + "T" + tarr[4] + tzoff
}
```

`split` gives `["Wed,", "21", "Sep", "2011", "15:02:01", "-0700"]`. The offset `-0700` becomes `-07:00`, and `+0530` becomes `+05:30`. Then the time library can format it:

```krl
time:strftime(rss2krlTime("Wed, 21 Sep 2011 15:02:01 -0700"), "%b %d %Y")   // "Sep 21 2011"
```

This expects a two-digit day, as RSS feeds use. For a feed that writes `1 Sep`, pad the day first, for example with `tarr[1].length() == 1 => "0" + tarr[1] | tarr[1]`.

*From the Pico Labs KRL Cookbook page "Converting Time Formats" (originally by Ed Orcutt). The time-zone handling here also covers offsets that aren't whole hours.*
