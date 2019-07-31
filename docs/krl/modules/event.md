# event

The `event` module provides access to the current executing event. These return `null` if the code is running when there is no event i.e. query.

## event:eci

Get the event channel id. `String` or `null`

## event:domain

Get the event domain. `String` or `null`

## event:name

Get the event name. `String` or `null`

## event:attrs

Get the event attributes. `Map` or `null`

## event:eid

Get the event transaction id. `String` or `null`

## event:time

Get the event timestamp as number of milliseconds since epoch. `Number` or `null`
