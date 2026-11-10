# Taking Action

There are just a few fundamental actions. The rest are built from these as [user-defined actions](/krl/krl-expression-language/user-defined-actions).

The following are the most commonly used basic actions are available in KRL:

**`send_directive(<expr>)`.** This returns a directive with the name given by the expression `<expr>`. (Don't confuse action names, `send_directive` in this case, and directive names given as the required parameter to the action.) Optional parameters provided to `send_directive` are passed through to the options structure of the directive as name-value pairs. This action is the primary means of creating directive documents for endpoints. For example, the following action produces the directive document below it:

```javascript
send_directive("say", {"something":"Hello World"})

{"directives":
 [{"options":{"something":"Hello World"},
   "name":"say",
   "meta":{
     "rule_name":"hello_world",
     "txn_id":"8FF45D92-7EDB-11DF-B34A-4BA9F4723EB4",
     "rid":"a16x66"
   }
  }
 ]
}
```

See the [send_directive()](/krl/rulesets/rules/actions/taking-action/send-directive) documentation for more details.

**http:post(&lt;expr>).** This action makes an HTTP `POST` to the URL given by `<expr>`. Any parameters in the optional `qs` map are added as name-value pairs in the query string of the URL. This action is useful for interacting with external Web services. For example, the following action makes an HTTP `POST` to the given URL, form-encoding `q` and sending it as the body of the `POST`:

```javascript
http:post("http://google.com/search", qs = {"q":"hello"})
```

See the [HTTP module documentation](/krl/libraries/http) for more information.

**event:send(&lt;expr>).** This action sends an event to another pico. The event channel of the other pico is specified in a map with the name "`cid`" (channel ID). The action also takes a domain and type for the event to send.  You can specify event attributes using the optional `with` clause:

```javascript
event:send({"cid": owner}, "fuse", event:type())
     with attrs = event:attrs();
```

For details about how this works, see the documentation for the [event library](/krl/libraries/event).

See also [User Defined Actions](https://picolabs.atlassian.net/wiki/display/docs/Creating+a+send_warning%28%29+Action) and [Compound Actions](/krl/rulesets/rules/actions/compound-actions).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189832) (last edited there 2020-02-05).</small>
