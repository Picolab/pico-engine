// var _ = require("lodash");
var test = require('tape')
var http = require('http')
var testA = require('../helpers/testA')
var eventModule = require('../../src/modules/event')

testA('module - event:attr(name)', async function (t) {
  var kevent = eventModule()

  t.equals(
    await kevent.def.attr({ event: { attrs: { foo: 'bar' } } }, ['foo']),
    'bar'
  )

  // just null if no ctx.event, or it doesn't match
  t.equals(await kevent.def.attr({}, ['baz']), null)
  t.equals(
    await kevent.def.attr({ event: { attrs: { foo: 'bar' } } }, ['baz']),
    null
  )
})

test('module - event:send(event, host = null)', function (t) {
  var serverReached = false
  var server = http.createServer(function (req, res) {
    serverReached = true

    var body = ''
    req.on('data', function (buffer) {
      body += buffer.toString()
    })
    req.on('end', function () {
      t.equals(req.url, '/sky/event/some-eci/none/some-d/some-t')
      t.equals(body, '{"foo":{},"bar":[],"baz":{"q":"[Function]"}}')

      res.end()
      server.close()
      t.end()
    })
  })
  server.listen(0, function () {
    var host = 'http://localhost:' + server.address().port;
    (async function () {
      var kevent = eventModule()

      t.equals(
        (await kevent.def.send({}, {
          event: {
            eci: 'some-eci',
            domain: 'some-d',
            type: 'some-t',
            attrs: { foo: {}, bar: [], baz: { 'q': function () {} } }
          },
          host: host
        }))[0],
        void 0// returns nothing
      )
      t.equals(serverReached, false, 'should be async, i.e. server not reached yet')
    }()).catch(t.end)
  })
})
