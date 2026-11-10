# event

> **Engine Compatibility:**
>
> This library has not been completely ported to the Node pico engine. However, it supports `attr()`, `attrs`, and a different form of `send()`. Scheduled event functions and actions are now part of the [schedule](/krl/libraries/schedule) library.
>
> `send` is asynchronous, supports `attrs` values of any type, and accepts an optional second parameter named `host`:
>
>
```javascript
event:send({"eci":"cj3btnlyj0001y6idgl4api8f", "domain":"test", "type":"test", "attrs":{}})
event:send({"eci":"cj3btnlyj0001y6idgl4api8f", "eid":"test", "domain":"test", "type":"test"}, null)
event:send({"eci":"cj3btnlyj0001y6idgl4api8f", "eid":"test", "domain":"test", "type":"test"}, "http://localhost")
event:send({"eci":"cj3btnlyj0001y6idgl4api8f", "eid":"none", "domain":"test", "type":"test"}, host="https://localhost:8080")
```

>
> If the eid is omitted (null) or `"none"`, `"null"`, or `""`, it will default to a random uuid.

The `event` library provides access to event properties, a function for getting attribute values, and an action for sending events.

# event properties

The `event` library provides five properties:

## `event:domain`

The value of this property is the domain which caused the rule to select.

## `event:name`

The value of this property is the event type (or name) which caused this rule to select.

## `event:eid`

The value of this property is the event identifier from the event to which this rule is reacting.

## `event:time`

The value of this property is the time at which the event was received by the pico-engine.

## `event:attrs`

The value of this property is a map of the attributes sent with the event to which this rule is reacting.

# event function

## `event:attr`

When this function is called with an attribute name, it returns the attribute value.

# event action

## `event:send`

As defined in the compatibility box above, this allows rules to send an event to another pico, whether on the same pico-engine or not.

> **older engines:**
>
> From this point, this page describes older pico engines.

## Event Functions

Event functions in the following categories are available:

### Event Environment

For historical reasons, some of these are Web-centric. The following functions are available:

**`event:env()-`**returns information about the event's environment. The function takes an argument that determines what will be returned:

- **`caller -`**return the URL of the Web page on which the event is firing (assumes an event in the `web` domain)
- **`ip -`** return the IP number of the endpoint (client).
- **`referer -`** return the URL of the referring page to the caller (assumes a web event).
- **`title -`** return the page title of the calling page.
- **`txn_id -`** return the transaction ID of this ruleset evaluation.

### Event Type and Domain

- `event:domain()` - return the event domain that caused this rule to execute.
- `event:type()` - return the event type (name) that caused this rule to execute.
- `event:name()` - alias for `event:type()`

### Event Attributes

- **`event:attr() -`** returns a specific event attribute. The function takes the name of the attribute to be returned as its sole argument, and returns `null` if not found.
- **`event:attrs -`** returns all the event attributes as a map.

### Event Channels

**`event:channel()`** - returns information about the event channel. The function takes an argument that determines what is returned:

- **`id`** - returns the event channel identifier.

## Event Actions

The event library supports sending events to event channels.

**`event:send(<subscription_map>, <domain>, <type>)`**

The `<domain>` and `<type>` are expressions that evaluate to strings. These arguments are optional. If they are not present, the values with keys `_domain` and `_type` from the subscription map will be used.

A subscription map is any map that contains an event channel identifier (identified by the key `cid`) or an event signal URL (identified by the key `esl`). The other key-value pairs in the map are optional. The following code sample shows a subscription map:

```javascript
subscription_map =
 {"name":"Phil",
  "phone":"8013625611",
  "cid":"072a3730-2f8a-052f-2ddb-00553e411455",
  "calendar":"https://www.google.com/calendar/..."
 };
```

Given the preceding subscription map declaration, we could send a `notification:status` event to the event channel identified by the CID in the map as follows:

```javascript
event:send(subscription_map, "notification", "status")
```

If the subscription map contains both a CID and an ESL, the ESL is used to send the event.

Event attributes can be specified in the optional action parameter `attrs`. To send a `notification:status` event with the attributes priority and subject, we would modify the preceding example as follows:

```javascript
event:send(subscription_map, "notification", "status")
  with attrs = {"priority": "2",
	            "subject" : "urgent message"
               }
```

Of course, the arguments and parameters of an action can be calculated.

If the ESL or CID have non-standard keys in the subscription map, you can use the parameters `cid_key` or `esl_key` to give the key name:

```javascript
event:send(subscription_map, "notification", "status")
  with attrs = {"priority": "2",
	            "subject" : "urgent message"
               }
   and cid_key = "channel_id"

event:send(subscription_map, "notification", "status")
  with attrs = {"priority": "2",
                "subject" : "urgent message"
               }
   and esl_key = "event_url"
```

### Asynchronicity

The default behavior of send() is to use the [Sky event protocol](https://picolabs.atlassian.net/wiki/display/docs/Sky+Event+API) in asynchronous mode. To force synchronous event processing, add the attribute `_async` with value 0 to the attributes.

```javascript
event:send(subscription_map, "notification", "status")
  with attrs = {"priority": "2",
	            "subject" : "urgent message".
                "_async" : 0
               }
```

Results

Results are only available for synchronous mode events. In general, you shouldn't be relying on results from sending an event. Rather, the recommended pattern is to have the receiving event network communicate by sending an event to the original sender. However, it is often useful to know whether or not the `send()` succeeded.  To support this, the system will raise a `system:send_complete` event when all threads have completed. The event has a single attribute called `send_results` that contains an array of the results of the individual sends. Each member of the array has the following structure:

```javascript
{"esl" : <esl>,
 "result" : {"status" : <http status code>,
             "reason" : <http reason>,
             "body" : <http body>
            }
}
```

You can use a rule like the following listen for the system event and loop over the results:

```javascript
  rule catch_complete {
    select when system send_complete
     foreach event:attr('send_results').pick("$..status") setting (status)
     notify("Status", "Send status is " + status);
  }
```

Obviously, you probably don't want to merely print the status out, but rather check it and do something if it is not 200.

### Patterns

#### Raising an Event On Final

A common pattern when sending events is to loop over the subscribers and then raise an explicit event when done. The [on final](/krl/rulesets/rules/postlude/guard-conditions) guard condition is used to ensure the explicit event is only raised once.

```javascript
rule dispatch {
  select when explicit schedule_inquiry
    foreach subscribers setting (subscriber)
      pre {
        resp_cookie = math:random(99);
      }
      event:send(subscriber,"schedule","inquiry")
          with attrs = {"from" : event:attr("From"),
                        "message": event:attr("Body"),
                        "cookie": resp_cookie
                        };
      }
      always {
        raise explicit event "subscribers_notified" on final
      }
}
```

The difference between raising an explicit event `on final` and using the system generated `system:send_complete` event shown above might not be obvious.

The primary difference is that the explicit event does have access to result information, including status. But, both the explicit event shown in the preceding code and the `system:send_complete` event will cause any rules that are selected based on the respective events to be scheduled. Similarly neither will cause rules to be run before `send()` is complete since parallel `send()` actions must all complete before the rule they are in can complete.

#### Encoding Structured Attributes

`event:send()` uses URL Form Encoding, which means that structured, nested attributes won't be passed correctly unless they are encoded. Here is a rule that sends and event and encodes the structured data:

```javascript
rule save_trip {
  select when fuse new_trip
  pre {
    vid = carvoyant:vehicle_id();
    trip_info = carvoyant:tripInfo(incoming{"tripId"});
    end_time = endTime(trip_info);
  }
  if(end_time neq "ERROR_NO_TIMESTAMP_AVAILABLE") then
  {event:send({"cid": vehicle:fleetChannel()}, "fuse", "updated_vehicle") with
       attrs = {"keyvalue": "last_trip_info",
                "vehicleId": vid,
	            "value": trip_info.encode()
		       }
  }
}
```

In the rule listening for the event, you have to decode the attribute:

```javascript
rule update_vehicle_data {
  select when fuse updated_vehicle
  pre {
    vid = event:attr("vehicleId");
	keyvalue = event:attr("keyvalue");
    vehicle_info = event:attr("value").decode();
  }
  {send_directive("Updated vehicle data for #{keyvalue} in fleet") with
     id = vid and
     values = vehicle_info and
	 keyvalue = keyvalue and
	 namespace = carvoyant_namespace;
  }
  always {
    set ent:fleet{[keyvalue, vid]} vehicle_info
  }
}
```

## Scheduled Event Functions

A [scheduled event](https://picolabs.atlassian.net/wiki/display/docs/%28Classic%29+Scheduling+events+in+the+Postlude) is created in the rule [postlude](/krl/rulesets/rules/postlude/).

The following functions are available to list, delete and get the history of scheduled events.

### get_list()

Returns an array of scheduled event arrays. A scheduled event array looks like

`[<SchedEv Id>,<domain>/<event name>,<event type>,<rid>,<next scheduled fire>]`

where

|  |  |
| --- | --- |
| ****SchedEv id**** | string |
| **event domain and type** | string |
| **schedule type** | 'once' | 'repeat' |
| **RID** | string |
| **next scheduled fire** | epoch time |
| **time specification** | `cron`-style timespec |
| **name** | name for recurring event |

event:get_list returns the scheduled events for the current account/entity. For example the following call

```javascript
schedEv_list = event:get_list();
```

might return

```
 [
  [
    '51cb5a2461bc204e53090000',
    'notification/_test_Islamization',
    'repeat',
    'cs_test',
    1372281480
  ]
]
```

**note: the format of the result is flexible.  I chose an array of arrays because KRL has some powerful array operators.  This could easily be a map of schedEv ids and values if that is a better usecase.*

### list_scheduled()

Returns an array of scheduled event maps. A scheduled event maps has the following fields:

|  |  |  |
| --- | --- | --- |
| **SchedEv id** | id | string |
| **event domain and type** | event | string |
| **schedule type** | type | 'once' | 'repeat' |
| **RID** | rid | string |
| **next scheduled fire** | next_scheduled | epoch time |
| **time specification** | timespec | `cron`-style timespec |
| **name** | name | name for recurring event |

The return results look like this:

```javascript
[
  {
    'next_scheduled' : 1466111340,
    'rid' : 'cs_test',
    'type' : 'repeat',
    'id' : '5763150227f093bc43090000',
    'event' : 'notification/_test_consubstantiating',
    'timespec' : '9 * * * *'
  },
  {
    'next_scheduled' : 1466129234,
    'rid' : 'cs_test',
    'type' : 'once',
    'id' : '57631502aae7dcbc430a0000',
    'event' : 'notification/_test_whiling'
  }
]
```

### scheduled_history(&lt;id>)

`event:scheduled_event_history()` accepts an id for a scheduled event.  This id could come from `event:list_scheduled()` or from the postlude. This will return the status from the last time the schedEv raised the event as a map.

```javascript
schedEv_history = event:scheduled_history("51cb2d2b3ce3ef083b090000");
```

History status for a single/once event:

```
{
  'fired' : '2013-06-26T21:16:21+00:00',
  'status' : '200 OK',
  'keep_until' : '2013-06-26T21:16:21Z',
  'code' : '200'
}
```

If the event had not fired the call would have returned null.  In this case, the scheduled event was a single/once so the field 'keep_until' indicates when the already completed event and history will be completely flushed from the system. The default is to keep the history for 4 hours.

History status for a repeating event:

```
{
  'fired' : '2013-06-26T21:16:21+00:00',
  'status' : '200 OK',
  'next' : '2013-06-26T21:20:00Z',
  'code' : '200'
}
```

In this case, the history is for a repeating event, so it will never be deleted unless event:delete is called for the id. Status is similar; noting when the last time the event fired, but also provides an estimate for the next time the event is scheduled to fire.  In this case, approximately 4 minutes after the last event was raised.

## Scheduled Event Actions

### remove_scheduled(&lt;id>)

The `event:remove_scheduled()`action accepts an id for a scheduled event.  This id could come from `event:list_scheduled()` or from the postlude. It removes the scheduled event from the queue. You can set a variable that contains a boolean status indicating whether or not the deletion was successful.

```javascript
event:remove_scheduled("51cb2d2b3ce3ef083b090000") setting(status);
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189929) (last edited there 2023-08-02).</small>
