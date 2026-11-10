# send_raw

send_raw is an action that allows you to send directives at the HTTP protocol level.  This means that you can set the HTTP headers, content and status returned to a client from a ruleset evaluation.

> **Draft Specification:**
>
> send_raw is not yet implemented.
>
> With a send_raw command, the developer is responsible for ensuring that the client listener can parse the response and that the content is formatted correctly.  As such, directives to the KRL runtime via send_directive and other runtime actions are not compatible with a send_raw directive and only a single send_raw directive is allowed as a result of a ruleset evaluation.
>
> Mixing raw and runtime directives or sending multiple raw documents is not going to generate a well-formed HTTP document.

### send_raw

Send an explicit document to an HTTP client

```
send_raw(&lt;HTTP content type>)
  with &lt;modifier> | and &lt;modifier1> .. | and &lt;modifierN>;
```

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;HTTP content type> | [string](http://en.wikipedia.org/wiki/Internet_media_type#List_of_common_media_types) | √ |

```
&lt;modifier>:
  &lt;modifier name> = &lt;modifier value>
```

|  |  |  |
| --- | --- | --- |
| Modifier | Datatype | |
| content | string | |
| headers | hash/map of HTTP header key values | |
| status | [string constant](http://perl.apache.org/docs/2.0/api/Apache2/Const.html#toc_C__http_) | |

This basic example serves a complete html document

**send_raw("text/hmtl")**

```
  global {
    full = <<
     <html>
      <head>
       <base href="http://www.w3schools.com/images/" target="_blank">
      </head>

     <body>
      <img src="stickman.gif" width="24" height="39"> - Notice that we have only specified a relative address for the image. Since we have specified a base URL in the head section, the browser will look for the image at "http://www.w3schools.com/images/stickman.gif"
      <br><br>
      <a href="http://www.w3schools.com">W3Schools</a> - Notice that the link opens in a new window, even if it has no target="_blank" attribute. This is because the target attribute of the base element is set to "_blank".

     </body>
    </html>
   >>;
 }

 rule first_rule {
   select when pageview ".*" setting ()
   pre {

   }
     send_raw("text/html") with content = full;
 }
```

This example sends a plain text string and (with headers) sets the cache time for 5 seconds and Last-Modified to the current time via the convenience time function time:httptime()

**send_raw("text/plain")**

```
  global {
    xtime = time:httptime(time:now());
    full = << If the foo sits, wear it #{xtime} >>;
 }

 rule first_rule {
   select when pageview ".*" setting ()
   pre {

   }
   {
     send_raw("text/plain")
       with content = full
         and headers = {
            'Cache-Control' : 'max-age=5',
            'Last-Modified' : xtime
     };
   }
 }
```

This example correctly returns a JSON string as "application/json" document

**send_raw("application/json")**

```
 rule first_rule {
   select when pageview ".*" setting ()
   pre {

     mHash = {
            'foo' : ['a', 1, 3.14],
            'bar' : 'string',
            'baz' : {
                'sum' : 'foobarbaz'
            }
        }
     mJson = mHash.encode();
   }
   {
     send_raw("application/json")
       with content = mJson;
   }
 }
```

This example returns a JSONp document

**send_raw("text/javascript")**

```
 rule first_rule {
   select when pageview ".*" setting ()
   pre {
     full = <<
       myFunc( {
            'foo' : ['a', 1, 3.14],
            'bar' : 'string',
            'baz' : {
                'sum' : 'foobarbaz'
            }
        })
    >>;
   }
   {
     send_raw("text/javascript")
       with content = full;
   }
 }
```

This example returns an HTTP redirect–with a redirect, the content-type is ignored but still required for the action

**HTTP redirect**

```
 send_raw("text/html")
   with
    headers = {
     'Status' : '302 Moved',
     'Location' : 'http://www.kynetx.com'
     } and
    status = 'REDIRECT';
```

This example shows how to use send_raw() to return an HTTP error

**HTTP NOT FOUND**

```
 send_raw("text/html")
   with
     headers = {
       'Status' : '404 Not Found'
     } and
     status = 'HTTP_NOT_FOUND';
```

#### Valid HTTP Headers

See the complete list [here](http://perl.apache.org/docs/2.0/api/Apache2/Const.html#C__http_).  Do not include the Apache2::Const prefix; ie: 'HTTP_CONFLICT" not 'Apache2::Const::HTTP_CONFLICT'

HTTP_OK (200) is the default if a status is not specified.

Common status codes

- HTTP_OK
- REDIRECT
- HTTP_NOT_FOUND
- HTTP_NO_CONTENT
- HTTP_BAD_REQUEST
- HTTP_ACCEPTED
- HTTP_INTERNAL_SERVER_ERROR

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1188643) (last edited there 2017-07-17).</small>
