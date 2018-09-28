var querystring = require('querystring')

module.exports = {
  'authorize': function (req, res, next) {
    var pe = req.pe
    pe.getRootECI().then(function (rootEci) {
      var event = {
        eci: rootEci,
        eid: 'authorize',
        domain: 'oauth',
        type: 'authorize',
        attrs: req.query
      }
      return pe.signalEvent(event)
    })
      .then(function (response) {
        var d = response.directives[0]
        if (!d) return next(new Error('No directive'))

        var qsp = []
        for (var key in d.options) {
          qsp.push(key + '=' + encodeURIComponent(d.options[key]))
        }
        res.redirect('/server.html#/' + d.name + '?' + qsp.join('&'))
      })
      .catch(next)
  },
  'approve': function (req, res, next) {
    var pe = req.pe
    pe.getRootECI().then(function (rootEci) {
      var event = {
        eci: rootEci,
        eid: 'approve',
        domain: 'oauth',
        type: 'approve',
        attrs: req.body
      }
      return pe.signalEvent(event)
    })
      .then(function (response) {
        var d = response.directives[0]
        if (!d) return next(new Error('No directive'))
        else if (d.name !== 'respond') {
          return next(new Error('Expecting respond, not ' + d.name))
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
          if (!redirectUri) return next(new Error('No redirect URI'))
          var sep = redirectUri.indexOf('?') !== -1 ? '&' : '?'
          res.redirect(redirectUri + sep + qsp.join('&'))
        }
      })
      .catch(next)
  },
  'token': function (req, res, next) {
    var pe = req.pe
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
        res.status(401).json({ error: 'invalid_client' })
        return
      }
      clientId = req.body.client_id
      clientSecret = req.body.client_secret
    }

    // end of code from OAuth in Action
    var attrs = req.body
    attrs.client_id = clientId
    attrs.client_secret = clientSecret
    pe.getRootECI().then(function (rootEci) {
      var event = {
        eci: rootEci,
        eid: 'token',
        domain: 'oauth',
        type: 'token',
        attrs: attrs
      }
      return pe.signalEvent(event)
    })
      .then(function (response) {
        var d = response.directives[0]
        if (!d) return next(new Error('No directive'))
        else if (d.name === 'error') {
          return next(d.options)
        } else {
          res.json(d.options)
        }
      })
      .catch(next)
  },
  'login': function (req, res, next) {
    var pe = req.pe
    pe.getRootECI().then(function (rootEci) {
      var event = {
        eci: rootEci,
        eid: '',
        domain: 'owner',
        type: 'eci_requested',
        attrs: req.body
      }
      return pe.signalEvent(event)
    })
      .then(function (response) {
        res.json(response)
      })
      .catch(next)
  },
  'new_account': function (req, res, next) {
    var pe = req.pe
    pe.getRootECI().then(function (rootEci) {
      var event = {
        eci: rootEci,
        eid: '',
        domain: 'owner',
        type: 'creation',
        attrs: req.body
      }
      return pe.signalEvent(event)
    })
      .then(function (response) {
        res.json(response)
      })
      .catch(next)
  }
}
