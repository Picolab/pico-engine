# Events from email

Any service that can call a webhook can raise events on a pico. Email is a good example: services such as [CloudMailin](https://www.cloudmailin.com/) give you an address and POST each message that arrives to a URL you choose. Point that URL at a pico:

```
https://<your engine>/sky/event/<eci>/mail/mail/received
```

The engine has to be reachable from the internet. For an engine on your own machine, a tunnel such as [ngrok](https://ngrok.com/) gives it a public address. Use a channel made for this purpose, whose policy allows only `mail:received`, so the webhook URL can't do anything else.

## Parse the message

The service's POST body becomes the event's attributes. With CloudMailin's JSON format, the headers and the plain-text body are in `headers` and `plain`:

```krl
rule mail_incoming {
  select when mail received
  pre {
    headers = event:attr("headers").defaultsTo({})
  }
  always {
    raise mail event "parsed" attributes {
      "date": headers{"Date"},
      "to": headers{"To"},
      "from": headers{"From"},
      "subject": headers{"Subject"},
      "text": event:attr("plain")
    }
  }
}
```

## Route it to another pico

One mail pico can serve many. Put the target pico's channel id in the address, as in `me+<eci>@cloudmailin.net`, and forward on it:

```krl
rule mail_router {
  select when mail parsed
    to re#[+]([^@]*)@#
    setting(eci)
  event:send({"eci": eci, "domain": "mail", "type": "events", "attrs": event:attrs})
}
```

The person writing the email needs that address, but not where the target pico lives.

## Turn lines into events

The target pico can treat each line of the body as an event to raise. Here, a line such as `aurora/on` raises `aurora:on`, and every other line is ignored:

```krl
rule mail_events {
  select when mail events
  foreach event:attr("text").defaultsTo("").split(re#\r?\n#) setting(request)
  pre {
    parts = request.split(re#/#)
    wanted = parts.length() == 2 && parts[0] == "aurora"
  }
  if wanted then noop()
  fired {
    raise aurora event parts[1]
  }
}
```

A body of

```
Turn on the lights, then show the second theme after this one.
aurora/on
aurora/next
aurora/next
```

raises `aurora:on` and `aurora:next` twice, which the pico's existing rulesets handle. The new ruleset doesn't change them.

Parsing the body is the fragile part. Email clients add things you don't expect, such as invisible characters. Test with messages from the clients your senders use.

*From the Pico Labs KRL Cookbook page "Triggering Events from Email Messages".*
