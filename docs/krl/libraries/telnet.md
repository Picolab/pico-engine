# Telnet

The telnet library connects a pico to a telnet host (or any line-oriented TCP service) and sends it commands.

Each pico has its own connection: connecting again closes the pico's earlier connection, and two picos can talk to different hosts at once. Connections are not persistent: they end when the engine restarts.

```krl
rule connect {
  select when device connect_requested
  telnet:connect({
    "host": "192.168.1.20",
    "port": 23,
    "negotiationMandatory": false
  }) setting(result)
  fired {
    ent:connected := result{"connected"}
  }
}

rule status {
  select when device status_requested
  telnet:sendCMD("status") setting(reply)
  fired {
    ent:last_status := reply
  }
}
```

## Actions

### connect

`telnet:connect(params)`

Opens a connection. `params` is a map; all of it is optional:

| name | description | default |
| --- | --- | --- |
| `host` | Host to connect to | `"127.0.0.1"` |
| `port` | Port | `23` |
| `timeout` | Milliseconds of inactivity before the socket times out | `1800000` (30 minutes) |
| `initialLFCR` | Send a CR+LF as soon as the connection opens | `true` |
| `negotiationMandatory` | Expect telnet option negotiation and a shell prompt. Set `false` for a plain TCP service. | `true` |
| `shellPrompt` | The host's shell prompt, a string or regular expression | `/(?:\/ )?#\s/`: a `#` and a space |
| `loginPrompt` | The login prompt | `login` followed by colons or spaces at the end of a line, any case |
| `passwordPrompt` | The password prompt | `password` the same way |
| `username`, `password` | Credentials sent at the login and password prompts | |
| `failedLoginMatch` | Text the host sends when a login fails | |
| `irs` | Input record separator, between lines of a response | `"\r\n"` |
| `ors` | Output record separator, sent after each command | `"\n"` |
| `echoLines` | Lines of command echo to drop from a response | `1` |
| `stripShellPrompt` | Leave the shell prompt out of responses | `true` |
| `sendTimeout` | Milliseconds to wait for a reply to `sendCMD` or `query` | `2000` |
| `execTimeout` | Milliseconds to wait for a command to finish at the shell prompt | `2000` |
| `maxBufferLength` | Most bytes of a response to keep | `1048576` |
| `pageSeparator` | Text the host shows between pages of output | `"---- More"` |

With `negotiationMandatory` left `true`, the connection is ready once the host shows its shell prompt (after logging in, if it asks). With `false`, it's ready as soon as the socket opens.

`connect` returns a map: `{"connected": true, "host": …, "port": …}`, or, when it fails, `{"connected": false, "host": …, "port": …, "error": …}`. A failed connection doesn't stop the rule.

### sendCMD

`telnet:sendCMD(command)`

Sends a command (with `ors` after it) and returns what the host sends back within `sendTimeout`. It raises an error if the pico has no connection.

### disconnect

`telnet:disconnect()`

Closes the pico's connection.

## Functions

### query

`telnet:query(command)`

The same as `sendCMD`, as a function, so a rule can use the reply in its prelude. It sends the command, so it isn't free of side effects like most functions.

### parameters

`telnet:parameters()`

The parameters of the pico's current or most recent connection, with the defaults filled in. The password is never included.

### host

`telnet:host()`

The host the pico is connected to, or last connected to.

## Events

The library raises these events to the pico, on the channel the `connect` event came in on:

| event | when | attributes |
| --- | --- | --- |
| `telnet:ready` | The host showed its shell prompt | |
| `telnet:failedlogin` | The login failed | |
| `telnet:socket_timeout` | The socket was idle for `timeout` | `duration` |
| `telnet:error` | A socket error | `message` |
| `telnet:closed` | The host closed the connection | |

`telnet:closed` isn't raised for `telnet:disconnect`.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/764772472) (last edited there 2019-07-26).</small>
