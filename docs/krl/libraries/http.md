# HTTP

## The HTTP Library

The HTTP library provides for more general, flexible access to cloud-based data than dataset and datasource declarations. The HTTP library supports the primary HTTP methods--`get`, `post`, `put`, `delete`, `head`, and `patch` as both functions and synchronous actions.

NOTE: Using GET to send data to an API is not very RESTful and is not recommended. KRL allows it for cases where the API has been written poorly and using GET is the only way to interact with it.

### HTTP Actions

#### Post

Interacting with cloud-based services usually involves sending data. To send data we use the `http:post()` action. The `http:post()` action takes a single argument, the URL of the resource accepting the POST request.

The **`http:post(url)`** action accepts the following optional parameters:

- **`qs`**— a map that will be used to create the URI encoded query parameters
- **`headers`**— a map with additional http headers
- **body** — a raw string for the http body
- **auth** — a optional map with keys `"username"` and `"password"` which is used to add a basic authentication header to the request
- **json —**data to encode the http body as json, also setting the `application/json` header (this parameter is ignored if **body** is provided)
- **form —**a map to encode as `application/x-www-form-urlencoded`, also setting that header (this parameter is ignored if **body** or **json** is provided)
- **parseJSON —**set this to true if you want to try to parse the `content` as json
- **autoraise**—****a string that will be the label applied to the event that this action automatically raises.
- **autosend** **—**a map like the map specifying an event to be sent in `event:send` (see [documentation of the event library](/krl/libraries/event)). It specifies the Event Channel Identifier (ECI), and the domain and type of an event to be added to a pico's queue when the HTTP response becomes available. Note that this will happen in a separate transaction. The pico to receive the response event must be hosted on the same pico engine.

The action supports an optional `setting` clause that gives the name of the variable in which the response to the HTTP request should be stored for later use. This variable is available to any expression executed after the action takes place: expressions in the parameters of later actions or in the postlude of the rule.

The resulting map of name-value pairs has the following structure:

- `content`— the content of the response
- `content_type`— the MIME type of the content
- `content_length`— the number of bytes in the content
- `headers` — a map with all the response headers
- `status_code`— the three digit HTTP status code
- `status_line`— the complete status string including the three digit HTTP status code
- `label`— the **autoraise** label, if **autoraise** is set (see above)

The following example shows using an `http:post()` action inside a rule:

```javascript
rule r1 {
 select when web pageview url re#/archives/#
 http:post("http://www.example.com/go", form = {"answer": "x"})
}
```

When this rule is selected, it will POST to the specified URL with a form-encoded body containing the name-value pair shown in the form map.

Here's another example showing the use of the `http:post()` action with the `https` protocol to POST raw content—XML in this case:

```javascript
rule r2 {
 select when web pageview url re#/archives/#
 http:post("https://example.com/printenv.pl",
   body =
              << <?xml encoding='UTF-8'?>
                 <feed version='0.3'>
                 </feed> >>,
   headers = {"content-type": "application/xml"})
}
```

#### Get

The `http:get()` action works in the same manner as `http:post()`, except that an HTTP GET is used instead of a POST.

#### Put

The `http:put()` action works in the same manner as `http:post()`, except that an HTTP PUT is used instead of a POST. For example, here is a [user defined action](/krl/krl-expression-language/user-defined-actions), `update`, that uses `http:put()`:

```javascript
update = defaction(id, value) {
   http:put(base_url+feed_id),
     json = {"version": vers,
             "datastreams":[
                {"id":id, "current_value":value}
             ]
            },
     headers= {"X-ApiKey": api_key,
               "content-type": "application/json"
              })
  }
```

#### Delete

The `http:delete()` action works in the same manner as `http:post()`, except that an HTTP DELETE is used instead of a POST.

#### Patch

The `http:patch()` action works in the same manner as `http:post()`, except that an HTTP PATCH is used instead of a POST.

#### Head

The `http:head()` action works in the same manner as `http:post()`, except that an HTTP HEAD is used instead of a POST.

### HTTP Functions

The same API for HTTP actions also can be used as a function in any KRL expression. The function always returns a map of name-value pairs, so the expression must expect the data in that format.

The following example shows using `http:get()` to call a URL on example.com:

```javascript
pre {
  r = http:get("http://example.com/widgets/printenv.pl"),
        qs = {"a": "5",
              "version": "dev"
             })
}
```

Often the parameters won't be a literal map as we've shown here, but a computed value. This function application would make the call to the example.com URL after fashioning a query string from the parameters in the map in the second argument. The URL called would be:

```
http://example.com/widgets/printenv.pl?a=5&version=dev
```

#### Usage Notes

Because the content (what you're likely after) is in a map, you will almost always need to pull it out. For example:

```javascript
url_content = http:get(my_url){"content"}
```

If you're retrieving JSON, you'll need to turn the string in the content field into a data structure using decode():

```javascript
json_from_url = http:get(my_url){"content"}.decode()
```

## Processing the Response

### With `autosend`

If `autosend` is set, the rule will complete evaluation, and at a later time, when the server at the URL returns its response, the event specified will be generated and added to the queue of the pico which provides the channel matching the ECI included in the `autosend` map.

### With `autoraise`

If `autoraise` is set, the rule will automatically raise an event with the event domain `http` and the event type equal to the HTTP method used (i.e. `post`, `put`, `get`, `delete`). The event will contain attributes with the same name-value structure that HTTP actions and function return.

Each action defines its own event domain and type. For the `http:post()` action the event that is raised will have event domain http and event type of post. Similarly, each action will include relevant data from the action. The response values are sent as event parameters and can thus be checked as part of the event selection. The `http:post()` action includes response information from the POST.

The following simple example shows a rule that has an `http:post()` action with an event autoraise:

```javascript
rule r1 {
  select when web pageview url re#archives/(\d+)# setting(year)
  http:post("http://www.example.com/go",
    form = {"answer": "x"},
    autoraise = "example")
}
```

This is roughly equivalent to the following rule:

```javascript
rule r1 {
  select when web pageview url re#archives/(\d+)# setting(year)
  http:post("http://www.example.com/go", form = {"answer": "x"}) setting (resp)
  always {
    raise explicit event "post" attributes resp
  }
}
```

The biggest difference is that the autoraise would create an event with the event domain `http` while the raise statement would create an event with the event type `explicit`.

Assuming we raised the `http:post` event in the first rule shown above, we could chain additional rules for subsequent processing of the response. The following two rules check the status code of the response and present a notification of the result:

```javascript
rule r2 {
  select when http post
               label re#example#
               status_code re#(2\d\d)# setting (status)
  send_directive("Status", {"status":"Success! The status is " + status})
}

rule r3 {
  select when http post
               label re#example#
               status_code re#([45]\d\d)# setting (status)
  fired {
    log error <<#{status}: #{event:attr("status_line")}>>
    last
  }
}
```

The second rule fires when the status code in the response indicates an error, logs the error, and uses the `last` control statement in the postlude to stop subsequent processing of rules in the ruleset.

This example rule shows the content of the response if its content type is “text.”

```javascript
rule r4 {
  select when http post label re#example#
  if(event:attr("content_type") like "^text/") then
    send_directive("Page says...", {"content":event:attr("content")})
}
```

Rule chaining from an autoraise on an `http:post()` action provides a convenient and simple way of easily dealing with the results of an action.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189608) (last edited there 2023-02-27).</small>
