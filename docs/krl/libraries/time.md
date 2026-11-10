# time

> **Note:**
>
> **time:atom()**, **time:compare()**, and time predicates have not yet been ported to the new pico engine.

The `time` library provides functions for determining the time and manipulating time values. KRE tries to determine the user's location and creates a time object that is localized for the user (i.e., in the user's time zone). The following functions are available:

- **`time:now()`** – returns the current date and time as a ISO8601 string (ex. "2017-03-08T22:45:18.887Z") based upon the user's location data.
- **`time:new()`** – returns a new RFC 3339 datetime string from a string formatted as described in ISO8601 (v2000).
- `time:add()` – adds (or subtracts) a specific number of time units to a source string.
- **`time:strftime()`** – returns a datetime string in a specified format following POSIX strftime conventions.
- `time:atom()` – converts a datetime string to an ATOM compatible form.
- **`time:compare()`** – takes two datetime strings (ISO8601) and returns 1, 0, or -1, depending on whether the first is before, the same, or after the second.

### time:now()

time:now() - returns the current date and time based on a time zone.

```javascript
xTime = time:now()		# 2010-10-06T18:11:47Z

xTime = time:now({		# 2010-10-06T18:11:47Z
	"tz" : "America/Los_Angeles"
})
```

The default time zone is determined by the operating system running Node and is used if an invalid time zone is provided. The list of valid time zones is updated periodically — for example, [version 0.40.0](https://github.com/Picolab/pico-engine/blob/v0.40.0/packages/pico-engine-core/package.json#L48) of the core engine [used IANA TZDB 2017b](https://github.com/moment/moment-timezone/blob/0.5.13/changelog.md#0512-2017-04-02).

### time:new()

time:new() - returns a new RFC 3339 datetime string from a string formatted as described in ISO8601 (v2000). It assumes UTC unless otherwise specified.

```javascript
time:new("2010-08-08")            # 2010-08-08T00:00:00Z (Date only—defaults to 00:00)
time:new("1967342")               # 1967-12-08T00:00:00Z (Year DayOfYear)
time:new("2011W206T1345-0600")    # 2011-05-21T19:45:00Z (Year WeekOfYear DayOfWeek)
time:new("083023Z")               # 2010-10-05T08:30:23Z (Time only—defaults to today)
```

Valid formats for the datetime source string can be found in [ISO8601 (v2000)](http://www.probabilityof.com/iso/8601v2000.pdf).

### time:add()

time:add() - adds (or subtracts) a specific number of time units to a source string, assuming UTC unless otherwise specified.

```javascript
time:add("2011W206T1345-0600",{"days": -65})    # 2011-03-17T13:45:00Z
time:add("2010-08-08",{"weeks": 5})             # 2010-09-12T00:00:00Z
time:add("1967342",{"hours": 3})                # 1967-12-08T04:00:00Z
time:add("083023Z",{"minutes": 10})             # 2010-10-06T08:40:23Z
time:add("1970-01-01",{"seconds": 1286388924})  # 2010-10-06T18:15:24Z
time:add("1967342", {"milliseconds": 5})        # 1967-12-08T00:00:00.005Z
time:add("1967342", {"ms": 5})                  # 1967-12-08T00:00:00.005Z
```

Unrecognized time units are ignored. The exact rules can get complicated considering leap years, different month lengths, and adding (or subtracting) multiple units at once versus one after another. See <http://momentjs.com/docs/#/manipulating/add/> (the time module uses a version above 2.18.0). UTC does not have daylight savings time.

### time:strftime()

time:strftime() - returns a datetime string in a specified format following [POSIX strftime conventions](http://pubs.opengroup.org/onlinepubs/9699919799/functions/strftime.html). It assumes the default time zone of the operating system running Node.

```javascript
time:strftime(xTime, "%F %T")          # 2010-10-06 18:15:24
time:strftime(xTime, "%F")             # 2010-10-06
time:strftime(xTime, "%T")             # 18:19:29
time:strftime(xTime, "%A %d %b %Y")    # Wednesday 06 Oct 2010
time:strftime(xTime, "%c")             # Oct 6, 2010 6:25:55 PM
time:strftime(xTime, "%s")             # 1286388924 -- seconds since epoch
```

Valid format arguments to strftime follow the [POSIX strftime](http://www.kernel.org/doc/man-pages/online/pages/man3/strftime.3.html) conventions. If the format string is invalid, the format string is returned as is.

> **Note:**
>
> The third argument below is not yet implemented.

`time:strftime()` takes an optional third argument that is used to specify the timezone of the resulting formatted string. This can be used, among other things, to simply convert the timezone by returning an ISO formatted datetime string. For example, the following function uses `time:strftime()` to convert an incoming datetime string to UTC:

```javascript
convertToUTC = function(dt) {
  time:strftime(dt, "%Y%m%dT%H%M%S%z", {"tz":"UTC"})
};
```

time:atom()

time:atom() - converts a datetime string to an ATOM compatible form.

```javascript
time:atom("2010-10-31")        # 2010-10-31T00:00:00Z
time:atom("2010-10-31",{       # 2010-10-31T06:00:00Z
    "tz" : "America/Denver"
})
```

## Time Predicates

These predicates depend on knowing timezone context for the event or query that causes them to run. The timezone context can be specified via a reserved event attribute, `_timezone`. If `_timezone` is not specified for an event `UTC` is used.

All times are 24-hour clock.

All predicates must be preceded by the modules name, for example:

time:weekend()

### timezone

timezone(&lt;arg>) - takes a timezone abbreviation as the argument and checks the user's geo-location (based on IP address) and returns true or false

```javascript
 rule glee_check {
   select when pageview ".*"
   if (time:timezone("MST")) then {
     notify("Glee alert", "Glee starts at 7pm");
   }
 }
```

### morning

time:morning() - returns true if it is between 0600 and 1200 hours, otherwise returns false.

### afternoon

time:afternoon() - returns true if it is between 1200 and 1700 hours, otherwise returns false.

### evening

time:evening() - returns true if it is bewteen 1700 and 2000 hours, otherwise returns false.

### night

time:night() - returns true if it is between 2000 and 2400 hours, otherwise returns false.

### lunch_time

time:lunch_time() - returns true if it is between 1130 and 1300 hours, otherwise returns false.

### late_morning

time:late_morning - returns true if it is between 1000 and 1200 hours, otherwise returns false.

### early_afternoon

time:early_afternoon - returns true if it is between 1200 and 1500 hours, otherwise returns false.

### late_afternoon

time:late_afternoon - returns true if it is between 1500 and 1700 hours, otherwise returns false.

### time_between

time:time_between(&lt;start hour>, &lt;start minute>, &lt;end hour>, &lt;end minute>) - returns true if local time is between the time specified, otherwise returns false.

### date_between

time:date_between(&lt;start month>, &lt;start day>, &lt;start year>, &lt;end month>, &lt;end day>, &lt;end year>) - returns true if the local time is between the specified dates (midnight), otherwise returns false.

### date_start

time:date_start(&lt;start month>, &lt;start day>, &lt;start year>) - returns true if the local time is on (or after) the specified date, otherwise returns false.

### day_of_week

time:day_of_week(&lt;day name>) - returns true if the current day of the week matches the name (capitalized) given as an argument, otherwise returns false.

### today_is

time:today_is(&lt;sun>, &lt;mon>,&lt;tue>, &lt;wed>, &lt;thur>, &lt;fri>, &lt;sat>) - returns true if it is the current day of the week, otherwise returns false. Note: Each argument must be either a 1 or 0 to indiate whether to check if today is the day of the week.

### weekday

time:weekday() - returns true if today is a weekday, otherwise returns false.

### weekend

time:weekend() - returns true if today is the weekend, otherwise returns false.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189927) (last edited there 2017-12-08).</small>
