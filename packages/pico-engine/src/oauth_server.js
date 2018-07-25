var querystring = require('querystring')

module.exports = {
  'authorize': function (req, res) {
    var pe = req.pe
    var errResp = req.errResp
    pe.getRootECI(function (err, rootEci) {
      if (err) return errResp(res, err)
      var event = {
        eci: rootEci,
        eid: 'authorize',
        domain: 'oauth',
        type: 'authorize',
        attrs: req.query
      }
      pe.signalEvent(event, function (err, response) {
        if (err) return errResp(res, err)
        var d = response.directives[0]
        if (!d) return errResp(res, 'No directive')
        else {
          var qsp = []
          for (var key in d.options) {
            qsp.push(key + '=' + encodeURIComponent(d.options[key]))
          }
          res.redirect('/server.html#/' + d.name + '?' + qsp.join('&'))
        }
      })
    })
  },
  'approve': function (req, res) {
    var pe = req.pe
    var errResp = req.errResp
    pe.getRootECI(function (err, rootEci) {
      if (err) return errResp(res, err)
      var event = {
        eci: rootEci,
        eid: 'approve',
        domain: 'oauth',
        type: 'approve',
        attrs: req.body
      }
      pe.signalEvent(event, function (err, response) {
        if (err) return errResp(res, err)
        var d = response.directives[0]
        if (!d) return errResp(res, 'No directive')
        else if (d.name !== 'respond') {
          return errResp(res, 'Expecting respond, not ' + d.name)
        } else {
          var redirectUri
          var qsp = []
          for (var key in d.options) {
            var val = encodeURIComponent(d.options[key])
            if (key === 'redirect_uri') {
              redirectUri = d.options[key]
            } else {
              qsp.push(key + '=' + val)
            }
          }
          if (!redirectUri) return errResp(res, 'No redirect URI')
          var sep = redirectUri.indexOf('?') !== -1 ? '&' : '?'
          res.redirect(redirectUri + sep + qsp.join('&'))
        }
      })
    })
  },
  'token': function (req, res) {
    var pe = req.pe
    var errResp = req.errResp
    var clientId
    var clientSecret
    // start of code borrowed from OAuth in Action
    var decodeClientCredentials = function (auth) {
      var clientCredentials = Buffer.from(auth.slice('basic '.length), 'base64').toString().split(':')
      var clientId = querystring.unescape(clientCredentials[0])
      var clientSecret = querystring.unescape(clientCredentials[1])
      return { id: clientId, secret: clientSecret }
    }
    var auth = req.headers['authorization']
    if (auth) {
      var clientCredentials = decodeClientCredentials(auth)
      clientId = clientCredentials.id
      clientSecret = clientCredentials.secret
    }

    if (req.body.client_id) {
      if (clientId) {
        console.log('Client attempted to authenticate with multiple methods')
        res.status(401).json({error: 'invalid_client'})
        return
      }
      clientId = req.body.client_id
      clientSecret = req.body.client_secret
    }

    // end of code from OAuth in Action
    var attrs = req.body
    attrs.client_id = clientId
    attrs.client_secret = clientSecret
    pe.getRootECI(function (err, rootEci) {
      if (err) return errResp(res, err)
      var event = {
        eci: rootEci,
        eid: 'token',
        domain: 'oauth',
        type: 'token',
        attrs: attrs
      }
      pe.signalEvent(event, function (err, response) {
        if (err) return errResp(res, err)
        var d = response.directives[0]
        if (!d) return errResp(res, 'No directive')
        else if (d.name === 'error') {
          return errResp(res, d.options)
        } else {
          res.json(d.options)
        }
      })
    })
  },
  'login': function (req, res) {
    var pe = req.pe
    var errResp = req.errResp
    pe.getRootECI(function (err, rootEci) {
      if (err) return errResp(res, err)
      var event = {
        eci: rootEci,
        eid: '',
        domain: 'owner',
        type: 'eci_requested',
        attrs: req.body
      }
      pe.signalEvent(event, function (err, response) {
        if (err) return errResp(res, err)
        res.json(response)
      })
    })
  },
  'new_account': function (req, res) {
    var pe = req.pe
    var errResp = req.errResp
    pe.getRootECI(function (err, rootEci) {
      if (err) return errResp(res, err)
      var event = {
        eci: rootEci,
        eid: '',
        domain: 'owner',
        type: 'creation',
        attrs: req.body
      }
      pe.signalEvent(event, function (err, response) {
        if (err) return errResp(res, err)
        res.json(response)
      })
    })
  }
}
