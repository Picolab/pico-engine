var _ = require('lodash')
var DOMParser = require('xmldom').DOMParser
var mkKRLfn = require('../mkKRLfn')
var mkKRLaction = require('../mkKRLaction')
var Telnet = require('telnet-client')
var ping = require('ping')

var connection = new Telnet()
// default parameters
var parameters = {
  "host": '127.0.0.1',
  "port": 23,
  "shellPrompt": "QNET>",
  "loginPrompt": "login:",
  "passwordPrompt": "password:",
  "username": 'root',
  "password": 'guest',
  "failedLoginMatch": new RegExp('bad.*login.*'),
  "initialLFCR": true,
  "timeout": 1800000 // 30 minutes
}

var raiseEvent;
var meta_eci;

var isValidHost = async function() {
  let response = await ping.promise.probe(parameters.host);
  return response.alive;
}

connection.on('connect', function () {
  console.log('telnet connection established!')
})

connection.on('ready', function (prompt) {
  console.log('ready!')
  raiseEvent({
    eci: meta_eci,
    eid: "telnet_ready",
    domain: "telnet",
    type: "ready"
  })
})

connection.on('writedone', function () {
  console.log('writedone event!');
  raiseEvent({
    eci: meta_eci,
    eid: "telnet_writedone",
    domain: "telnet",
    type: "writedone"
  })
})

connection.on('failedlogin', function () {
  console.log('failedlogin event!')
  raiseEvent({
    eci: meta_eci,
    eid: "telnet_failedlogin",
    domain: "telnet",
    type: "failedlogin",
  })
})

connection.on('timeout', function () {
  console.log('socket timeout!')
  raiseEvent({
    eci: meta_eci,
    eid: "telnet_socket_timeout",
    domain: "telnet",
    type: "socket_timeout",
    attrs: { "duration": parameters.timeout }
  })
})

connection.on('error', function () {
  console.log('telnet error!');
  raiseEvent({
    eci: meta_eci,
    eid: "telnet_error",
    domain: "telnet",
    type: "error"
  })
})

connection.on('end', function () {
  console.log('telnet host ending connection!');
})

connection.on('close', function () {
  console.log('connection closed')
})

module.exports = function (core) {
  return {
    def: {
      'parameters': mkKRLfn([
      ], function (ctx, args) {
        return parameters;
      }),
      'host': mkKRLfn([
      ], function (ctx, args) {
        return parameters.host;
      }),
      'connect': mkKRLaction([
        'params'
      ], async function (ctx, args) {
        if (_.has(args, 'params')) {
          Object.keys(args.params).forEach(function(key) {
            parameters[key] = args.params[key]
          })
        }

        let alive = await isValidHost();
        console.log("alive", alive);

        if (alive) {
          meta_eci = _.get(ctx, ['event', 'eci'], _.get(ctx, ['query', 'eci']))
          raiseEvent = core.signalEvent;
          connection.connect(parameters);
          let res = await connection.send(
            parameters.username + '\r\n' + parameters.password + '\r\n'
          );
          return res;
        }
        return "Unable to connect to host " + parameters.host;
      }),
      'disconnect': mkKRLaction([
      ], async function (ctx, args) {
        let res = await connection.end();
        return res;
      }),
      'sendCMD': mkKRLaction([
        'command'
      ], async function (ctx, args) {
        if (!_.has(args, 'command')) {
          throw new Error('telnet:sendCMD needs a command string')
        }
        console.log('send cmd args', args)
        let res = await connection.send(args.command + '\r\n');
        return res;
      }),
      'query': mkKRLfn([
        'command'
      ], async function (ctx, args) {
        if (args.command.substring(0,1) !== "?") {
          throw new Error('telnet:query(q): q must begin with a ?')
        }
        console.log('send query args', args)
        let res = await connection.send(args.command + '\r\n');
        return res;
      }),
      'extractDataFromXML': mkKRLfn([
        'xml'
      ], function(ctx, args) {
        if (!_.has(args, 'xml')) {
          throw new Error('telnet:getAreasFromXML requires an xml string')
        }
        var doc = new DOMParser().parseFromString(args.xml)
        var areaElements = doc.getElementsByTagName("Area")
        var data = {}

        for (i = 0; i < areaElements.length; i++) {
          var areaName = areaElements[i].getAttribute("Name")
          var areaID = areaElements[i].getAttribute("IntegrationID")

          var outputs = areaElements[i].getElementsByTagName("Outputs")[0]
          var lightElements = outputs.getElementsByTagName("Output")
          var lights = []
          for (j = 0; j < lightElements.length; j++) {
            var id = lightElements[j].getAttribute("IntegrationID")
            var isShade = lightElements[j].getAttribute("OutputType") == "SYSTEM_SHADE" ? true : false
            if (!isShade) {
              lights.push(id)
            }
          }

          var shadegroups = areaElements[i].getElementsByTagName("ShadeGroups")[0]
          var shadeElements = shadegroups.getElementsByTagName("ShadeGroup")
          var shades = []
          for (j = 0; j < shadeElements.length; j++) {
            var id = shadeElements[j].getAttribute("IntegrationID")
            shades.push(id)
          }

          data[areaName] = {"name": areaName, "id": areaID, "type": "area",
                            "lights": lights, "shades": shades }
        }
        return data
      })
    }
  }
}
