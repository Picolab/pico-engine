# ical

The ical library formats [iCalendar](https://www.rfc-editor.org/rfc/rfc5545) calendars, the `.ics` files calendar apps subscribe to and import.

## Functions

### from_array

`ical:from_array(<entry array>, <meta map>)`

Returns an iCalendar string with one event (`VEVENT`) for each map in the entry array. The keys of each map are iCalendar property names, in any case. These are the common ones:

| name | description | required | repeatable |
| --- | --- | --- | --- |
| `dtstart` | Start time of the event | yes |  |
| `dtend` | End time of the event |  |  |
| `duration` | How long the event lasts, as an iCalendar duration such as `PT1H30M` |  |  |
| `summary` | Short summary of the event |  |  |
| `description` | Long description |  |  |
| `location` | Location of the event |  |  |
| `geo` | Latitude and longitude: `[lat, lon]`, `{"lat": …, "lon": …}`, or `"lat;lon"` |  |  |
| `organizer` | Organizer (see below) |  |  |
| `attendee` | Attendee (see below) |  | yes |
| `url` | URL associated with the event |  |  |
| `uid` | Unique identifier |  |  |
| `comment` | Comment |  | yes |
| `categories` | An array of category names |  |  |

Other iCalendar event properties (`status`, `rrule`, `sequence`, and so on) are written as given.

- **Times.** `dtstart`, `dtend`, `dtstamp`, `due`, `created`, `last-modified`, `recurrence-id`, `exdate`, `rdate`, and `completed` take an ISO 8601 time (such as `time:now()` returns, or `"2026-11-20T09:00:00-07:00"`), a number of milliseconds since 1970, or a date (`"2026-11-20"`) for an all-day event. Times are written in UTC. A value already in iCalendar form (`"20261120T160000Z"` or `"20261120"`) is used as is.
- **People.** `organizer` and `attendee` take an email address, a map `{"name": …, "email": …}`, a URI such as `"mailto:ada@example.com"`, or a plain name.
- **Repeats.** For a repeatable property, give an array to write it more than once.
- **Text.** Commas, semicolons, backslashes, and line breaks in text properties are escaped as iCalendar requires.

Each event gets a `uid` if it has none (a random one, so give your own if the calendar is fetched more than once) and a `dtstamp` of the current time. Lines end in CRLF and long lines are folded, as the specification requires.

The meta map is optional:

| name | description |
| --- | --- |
| `name` | Name of the calendar |
| `desc` | Description of the calendar |

#### Example

A ruleset can serve its events as a calendar subscription by returning the text from a function shared on a channel and fetching `/sky/cloud/<eci>/<rid>/calendar.txt`:

```krl
calendar = function() {
  ical:from_array(
    ent:meetings.values().map(function(m) {
      {
        "uid": m{"id"} + "@example.com",
        "dtstart": m{"start"},
        "duration": "PT1H",
        "summary": m{"title"},
        "attendee": m{"emails"}
      }
    }),
    {"name": "Team meetings"}
  )
}
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1184818) (last edited there 2017-02-17).</small>
