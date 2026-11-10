# Telnet

This module allows for connections and communications to telnet hosts

> **Note:**
>
> This library has not yet been ported to the Node Pico Engine

Since this module has not yet been ported to the pico engine, you will have to add it in yourself. Here are the steps to add the module:

1. Find the path to your pico-engine
2. Navigate to **pico-engine/packages/pico-engine-core/src/modules/**
3. Create a file called telnet.js
4. Copy the source code from this link <https://raw.githubusercontent.com/Picolab/krl-node-modules/master/modules/telnet.js> and paste it in your new telnet.js file
5. Go to the index.js file in the same folder you are currently in (pico-engine/packages/pico-engine-core/src/modules/)
6. Find variable subModules near the top of the file (should be around line 6)
7. Add a definition mapped to your telnet file to the bottom of the subModules variable. (i.e. telnet: require('./telnet')

   1. Don’t forget to add a comma to the end of line directly above the one you just added

```javascript
var subModules = {
  ent: require('./ent'),
  app: require('./app'),
  event: require('./event'),
  engine: require('./engine'),
  http: require('./http'),
  indy: require('./indy'),
  keys: require('./keys'),
  math: require('./math'),
  meta: require('./meta'),
  schedule: require('./schedule'),
  time: require('./time'),
  random: require('./random'),
  telnet: require('./telnet')
}
```

> **Note:**
>
> This telnet module uses another npm module that is not currently on the engine

1. Install ping dependency

   a. Navigate two directories up **pico-engine/packages/pico-engine-core/**

   b. Enter this terminal command: **npm install --save ping**
2. Save all the changes to the pico engine

   1. Navigate to the root path **/pico-engine**
   2. Execute this command **npm run setup**

You’re all done! Now you can start your pico-engine with the **npm start** command and work with telnet

---

### Telnet Actions

**telnet:connect(params)**

Creates a new TCP connection to the specified host, where 'params' is an object which can include following properties:

- *`host`: Host the client should connect to. Defaults to '127.0.0.1'.
- *`port`: Port the client should connect to. Defaults to '23'.
- *`timeout`: Sets the socket to timeout after the specified number of milliseconds of inactivity on the socket. Defaults to 180000 (30 minutes)
- `shellPrompt`: Shell prompt that the host is using. Can be a string or an instance of RegExp. Defaults to regex '/(?:/ )?#\s/'.
- `loginPrompt`: Username/login prompt that the host is using. Can be a string or an instance of RegExp. Defaults to regex '/login[: ]*$/i'.
- `passwordPrompt`: Password/login prompt that the host is using. Can be a string or an instance of RegExp. Defaults to regex '/Password: /i'.
- `failedLoginMatch`: String or regex to match if your host provides login failure messages. Defaults to undefined.
- *`initialLFCR`: Flag used to determine if an initial '\r\n' (CR+LF) should be sent when connected to server.
- *`username`: Username used to login. Defaults to 'root'.
- *`password`: Password used to login. Defaults to 'guest'.
- `sock`: Duplex stream which can be used for connection hopping/reusing.
- `irs`: Input record separator. A separator used to distinguish between lines of the response. Defaults to '\r\n'.
- `ors`: Output record separator. A separator used to execute commands (break lines on input). Defaults to '\n'.
- `echoLines`: The number of lines used to cut off the response. Defaults to 1.
- `stripShellPrompt`: Whether shell prompt should be excluded from the results. Defaults to true.
- `negotiationMandatory`: Disable telnet negotiations if needed. Can be used with 'send' when telnet specification is not needed. Telnet client will then basically act like a simple TCP client. Defaults to true.
- `sendTimeout`: A timeout used to wait for a server reply when the 'sendCMD' action is used. Defaults to 2000 (ms).
- `maxBufferLength`: Maximum buffer length in bytes which can be filled with response data. Defaults to 1M.
- `debug`: Enable/disable debug logs on console. Defaults to false.

Resolves once the connection is ready. Rejects if the timeout is hit or if the ping module does not receive a response from the specified host.

Parameters marked with an asterisk * can be queried in the telnet:parameters() function. Any additional parameters will only be returned in that function after being provided in a telnet:connect(params) action.

**telnet:disconnect()**

Half-closes the socket. i.e., it sends a FIN packet. It is possible the server will still send some data.

**telnet:sendCMD(command)**

Sends data on the socket without requiring telnet negotiations.

### Telnet Functions

**telnet:parameters()**

Returns the marked parameters above as well as any additional parameters passed in with the telnet:connect(params) action.

**telnet:host()**

Returns the telnet host (ip address) that the engine will attempt to connect to or is currently connected to.

**telnet:query(command)**

Sends data on the socket without requiring telnet negotiations and awaits a response. This does the same thing as telnet:sendCMD(command) action but is used as a KRL function instead of a KRL action

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/764772472) (last edited there 2019-07-26).</small>
