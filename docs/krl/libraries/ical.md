# ical

The ICal library provides functions related to the iCalendar specification.

> **Engine Compatibility:**
>
> This library has not yet been ported to the New Pico Engine

## Functions

`ical:from_array(<entry array>, <meta map>)`

Formats a iCalendar calendar string.

This function takes an array of maps representing the iCalendar entries to be formatted and a map with meta data about the calendar.

Each map in the entry array can have the following properties

| name | description | required | repeatable |
| --- | --- | --- | --- |
| `dtstart` | Start time of event | yes |  |
| `dtend` | End time of event | unless `duration` used |  |
| `duration` | Time event lasts | unless `dtend` used |  |
| `summary` | Short summary of event |  |  |
| `description` | Long description |  |  |
| `organizer` | Name of organizer |  |  |
| `location` | Location of event |  |  |
| `geo` | Latlong coordinates of event |  |  |
| `url` | URL associated with event |  |  |
| `uid` | Universal identifier | yes |  |
| `comment` | Comment or not |  | yes |
| `attendee` | People attending event (see [spec](http://www.ietf.org/rfc/rfc2445.txt)) |  | yes |

This list is not exhaustive. Other valid properties of iCalendar events are also supported according to the [specification](http://www.ietf.org/rfc/rfc2445.txt).

The function automatically adds a UID property to each iCalendar entry if one is not provided.

The meta map is optional and contains two mappings:

| name | description |
| --- | --- |
| `name` | Name of the calendar |
| `desc` | Description of calendar |

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1184818) (last edited there 2017-02-17).</small>
