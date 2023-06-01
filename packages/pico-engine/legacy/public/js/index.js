/* global $, sessionStorage, location, handlePicoLogin, Handlebars, picoAPI */
$(document).ready(function () {
  var jsonName = location.search.substring(1)
  var renderDemo = jsonName.length > 0
  if (!String.prototype.escapeHTML) {
    String.prototype.escapeHTML = function () { // eslint-disable-line
      return this.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    }
  }
  var leftRadius = function (nodeId) {
    var theNode = $('#' + nodeId)
    return Math.floor(
      (parseFloat(theNode.css('border-left-width')) +
        parseFloat(theNode.css('padding-left')) +
        parseFloat(theNode.css('width')) +
        parseFloat(theNode.css('padding-right')) +
        parseFloat(theNode.css('border-right-width'))) /
        2
    )
  }
  var topRadius = function (nodeId) {
    var theNode = $('#' + nodeId)
    return Math.floor(
      (parseFloat(theNode.css('border-top-width')) +
        parseFloat(theNode.css('padding-top')) +
        parseFloat(theNode.css('height')) +
        parseFloat(theNode.css('padding-bottom')) +
        parseFloat(theNode.css('border-bottom-width'))) /
        2
    )
  }
  var springLine = function () {
    var $line = $(this)
    var x1 = parseInt($line.attr('x1'))
    var x2 = parseInt($line.attr('x2'))
    var y1 = parseInt($line.attr('y1'))
    var y2 = parseInt($line.attr('y2'))
    if (!x1 || !x2 || !y1 || !y2) return // incomplete line
    var lng = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    if (lng > 1200) lng = 1200
    // min stroke width 4.5
    else if (lng < 100) lng = 100 // min dash spacing 0.5
    $line.css('strokeWidth', (1200 - lng) / 200 + 4.5)
    $line.css('strokeDasharray', '2,' + lng / 200)
  }
  var updateLines = function (nodeId, theLeft, theTop) {
    var lR = leftRadius(nodeId)
    var tR = topRadius(nodeId)
    $('.' + nodeId + '-origin').attr({
      x1: theLeft + lR + 'px',
      y1: theTop + tR + 'px'
    })
    $('.' + nodeId + '-target').attr({
      x2: theLeft + lR + 'px',
      y2: theTop + tR + 'px'
    })
    $('line.subscription').each(springLine)
  }
  var updateEdges = function (nodeId) {
    var theLeft = parseFloat($('#' + nodeId).css('left'))
    var theTop = parseFloat($('#' + nodeId).css('top'))
    updateLines(nodeId, theLeft, theTop)
  }
  var dragmove = function (event, ui) {
    var nodeId = ui.helper[0].getAttribute('id')
    updateLines(nodeId, ui.position.left, ui.position.top)
  }
  var formToJSON = function (form) {
    var json = {}
    $.each($(form).serializeArray(), function (key, elm) {
      json[elm.name] = elm.value
    })
    return json
  }
  var capTemplate = Handlebars.compile($('#capabilities-template').html())
  var rulesetVarsTemplate = Handlebars.compile($('#rulesets-template-vars').html())
  var uiTemplate = Handlebars.compile($('#the-template').html())
  var aboutTemplate = Handlebars.compile($('#about-template').html())
  var rulesetsTemplate = Handlebars.compile($('#rulesets-template').html())
  var channelsTemplate = Handlebars.compile($('#channels-template').html())
  var policiesTemplate = Handlebars.compile($('#policies-template').html())
  var subscriptionsTemplate = Handlebars.compile($('#subscriptions-template').html())
  var loggingTemplate = Handlebars.compile($('#logging-template').html())
  var testingTemplate = Handlebars.compile($('#testing-template').html())
  var agentTemplate = Handlebars.compile($('#agent-template').html())

  $.getJSON('/api/legacy-ui-data-dump', function (dbDump) {
    var dragstop = function (event, ui) {
      var nodeId = ui.helper[0].getAttribute('id')
      $('#' + nodeId)
        .next('.pico-edit')
        .css('left', ui.position.left)
        .css('top', ui.position.top)
      if (!renderDemo) {
        $.getJSON(
          '/sky/event/' + findEciById(nodeId) + '/drag_pico/visual/moved',
          { left: ui.position.left, top: ui.position.top }
        )
      }
    }
    // specialize the db for the particular tab
    var specDB = function (tabName, thePicoInp, dname, callback) {
      var eci = findEciById(thePicoInp.id)
      if (tabName === 'about') {
        var hasRID = function (pid, rid) {
          return !!get(dbDump.pico, [pid, 'ruleset', rid])
        }
        var thePicoOut = {}
        thePicoOut.pico_id = thePicoInp.id
        thePicoOut.id = thePicoInp.id
        thePicoOut.eci = eci
        var ppECI = getP(thePicoInp, 'parent_eci', undefined)
        var pp = ppECI
          ? { id: get(dbDump.channel, [ppECI, 'pico_id']), eci: ppECI }
          : undefined
        if (pp) {
          thePicoOut.parent = {}
          thePicoOut.parent.id = pp.id
          thePicoOut.parent.eci = pp.eci
          thePicoOut.parent.dname = getV(pp, 'dname', undefined)
        }
        if (thePicoInp.id === rootPico.id || (pp && pp.id === rootPico.id)) {
          var pswdAuth = hasRID(
            thePicoInp.id,
            'io.picolabs.owner_authentication'
          )
          var didAuth = hasRID(thePicoInp.id, 'io.picolabs.did_auth_only')
          thePicoOut.isOwner = pswdAuth || didAuth
          thePicoOut.pswdAuth = pswdAuth
        }
        thePicoOut.children = []
        var reportedChildren = getP(thePicoInp, 'children', [])
        var i = 0
        var cLen = reportedChildren.length
        for (; i < cLen; ++i) {
          var p = reportedChildren[i]
          var cp = {}
          cp.id = p.id
          cp.eci = p.eci
          if (dbDump.pico[p.id] === undefined) continue
          cp.dname = getV(p, 'dname', undefined)
          cp.canDel = getP(p, 'children', []).length === 0
          thePicoOut.children.push(cp)
        }
        thePicoOut.dname = getV(thePicoInp, 'dname', dname)
        thePicoOut.color = getV(
          thePicoInp,
          'color',
          thePicoOut.parent ? '#7FFFD4' : '#87CEFA'
        )
        if (thePicoOut.color.charAt() != '#') {
          var colorCode = '#'+$('#'+thePicoInp.id).css('background-color')
            .match(/rgba?\((\d+),\s*(\d+),\s*(\d+).*\)/)
            .slice(1).map(function(n){
              return (Number(n)<16?"0":"")+Number(n).toString(16)
            }).join('')
          thePicoOut.color = colorCode
        }
        callback(null, thePicoOut)
      } else if (tabName === 'rulesets') {
        var theRulesetInp = thePicoInp
        var installedRS = {}
        for (var rs in theRulesetInp.ruleset) {
          installedRS[rs] = theRulesetInp.ruleset[rs]
          if (
            rs !== 'io.picolabs.wrangler' &&
            rs !== 'io.picolabs.visual_params'
          ) {
            installedRS[rs].canDel = true
          }
        }
        var avail = []
        dbDump.enabledRIDs.forEach(function (rid) {
          if (installedRS[rid] === undefined) {
            avail.push(rid)
          }
        })
        var theRulesetOut = {
          pico_id: thePicoInp.id,
          eci: eci,
          installed: installedRS,
          avail: avail
        }
        callback(null, theRulesetOut)
      } else if (tabName === 'logging') {
        var theLoggingOut = {}
        theLoggingOut.eci = eci
        theLoggingOut.pico_id = thePicoInp.id
        if (get(dbDump, ['pico', thePicoInp.id, 'ruleset', 'io.picolabs.logging', 'on'])) {
          $.getJSON('/api/legacy-ui-get-vars/' + thePicoInp.id + '/io.picolabs.logging', function (data) {
            var ent_status = data.find(function(o){
              return o.name === 'status'
            })
            theLoggingOut.status = ent_status ? ent_status.val : false
            if (theLoggingOut.status) {
              var episode_limit = $('#episode_limit').val() || 10
              $.getJSON('/api/pico/' + thePicoInp.id + '/logs', function (data) {
                var episodes = groupLogsByEpisode(data)
                var episode_keys = episodes ? Object.keys(episodes) : []
                theLoggingOut.episode_count = episode_keys.length
                if (episode_keys.length > episode_limit) {
                  episode_keys.length = episode_limit
                }
                theLoggingOut.logs = {}
                episode_keys.forEach(function (key) {
                  theLoggingOut.logs[key] = episodes[key]
                })
                callback(null, theLoggingOut)
              }).fail(function (err) {
                theLoggingOut.error = 'Failed to get data'
                callback(null, theLoggingOut)
              })
            } else {
              callback(null, theLoggingOut)
            }
          }).fail(function(err){
            theLoggingOut.status = false
            theLoggingOut.error = 'Failed to get status'
            callback(null, theLoggingOut)
          })
        } else {
          theLoggingOut.disabled = true
          callback(null, theLoggingOut)
        }
      } else if (tabName === 'testing') {
        var testing = []
        eci = findEciById(thePicoInp.id)
        for (rid in thePicoInp.ruleset) {
          testing.push({ rid: rid })
        }
        var theChannels = []
        Object.keys(thePicoInp.channel).forEach(function (id) {
          var aChannel = get(thePicoInp, ['channel', id], undefined)
          if (aChannel) {
            if (aChannel.type === 'secret' && aChannel.name === 'admin') {
              aChannel.default = true
            }
            theChannels.push(aChannel)
          }
        })
        callback(null, { pico_id: thePicoInp.id, eci: eci, testing: testing, channels: theChannels })
      } else if (tabName === 'channels') {
        var theChannels = []
        var thePolicies = get(dbDump, ['policy'])
        Object.keys(thePicoInp.channel).forEach(function (id) {
          var aChannel = get(thePicoInp, ['channel', id], undefined)
          if (aChannel) {
            if (aChannel.type !== 'secret' || aChannel.name !== 'admin') {
              aChannel.canDel = true
            }
            var thePolicy = thePolicies[aChannel.policy_id]
            aChannel.policy_name = thePolicy.name
            aChannel.policy_text = JSON.stringify(thePolicy, undefined, 2)
            theChannels.push(aChannel)
          }
        })
        callback(null, {
          pico_id: thePicoInp.id,
          id: thePicoInp.id,
          eci: thePicoInp.admin_eci,
          channel: theChannels,
          policy: thePolicies
        })
      } else if (tabName === 'subscriptions') {
        var theSubscriptions = {}
        theSubscriptions.pico_id = thePicoInp.id
        theSubscriptions.eci = eci
        var subsRID = 'io.picolabs.subscription'
        if (get(dbDump, ['pico', thePicoInp.id, 'ruleset', subsRID, 'on'])) {
          var subscribablePicos = []
          for (var k in dbDump.channel) {
            var aChannel = dbDump.channel[k]
            if (aChannel.name === 'wellKnown_Rx') {
              if (aChannel.pico_id === thePicoInp.id) {
                theSubscriptions.wellKnown_Rx = k
              } else { // avoid offering subscription to self
                subscribablePicos.push({
                  id: aChannel.id,
                  pico_name: getV({ id: aChannel.pico_id }, 'dname')
                })
              }
            }
          }
          theSubscriptions.subscribable_picos = subscribablePicos.sort(
            function (a, b) {
              var nameA = a.pico_name.toUpperCase()
              var nameB = b.pico_name.toUpperCase()
              if (nameA < nameB) return -1
              if (nameB < nameA) return 1
              return 0
            }
          )
        } else {
          theSubscriptions.disabled = true
        }
        var theSubsVars = get(dbDump, [
          'pico',
          thePicoInp.id,
          subsRID,
          'vars'
        ])
        var recSubs = function (subsType) {
          if (theSubsVars && theSubsVars[subsType]) {
          } else return
          var someSub = {}
          var subCount = 0
          var theSubs = theSubsVars[subsType]
          Object.keys(theSubs).forEach(function (id) {
            ++subCount
            someSub[id] = theSubs[id]
            someSub[id].asString = JSON.stringify(theSubs[id], undefined, 2)
            var subsECI = theSubs[id].Tx || theSubs[id].wellKnown_Tx
            var pico = { id: get(dbDump.channel, [subsECI, 'pico_id']) }
            someSub[id].name = getV(pico, 'dname')
          })
          if (subCount) theSubscriptions[subsType] = someSub
        }
        recSubs('established')
        recSubs('outbound')
        recSubs('inbound')
        callback(null, theSubscriptions)
      } else if (tabName === 'policies') {
        var policyUI = { disabled: true, eci: eci, pico_id: thePicoInp.id }
        $.getJSON('/sky/cloud/' + eci + '/io.picolabs.policy/ui', function (ui) {
          callback(null, {
            pico_id: thePicoInp.id,
            ui: ui,
            text: JSON.stringify(ui, undefined, 2)
          })
        }).fail(function () {
          callback(null, policyUI)
        })
      } else if (tabName === 'agent') { // Deprecated
        var agentECI
        Object.keys(thePicoInp.channel).forEach(function (id) {
          var aChannel = get(thePicoInp, ['channel', id], undefined)
          if (aChannel) {
            if (aChannel.type === 'sovrin' && aChannel.name === 'agent') {
              agentECI = aChannel.id
              eci = agentECI
            }
          }
        })
        var agentUI = { eci: eci, pico_id: thePicoInp.id }
        agentUI.agentECI = agentECI
        $.getJSON('/sky/event/' + eci + '/poll_router/edge/poll_all_needed',
        function(){
          $.getJSON('/sky/cloud/' + eci + '/org.sovrin.agent/ui',function(ui){
            agentUI.ui = ui
            $.getJSON('/sky/cloud/'+eci+'/org.sovrin.edge/ui',function(rui){
              agentUI.ui.routerUI = rui
              callback(null, agentUI)
            }).fail(function(){
              callback(null, agentUI)
            })
          }).fail(function () {
            agentUI.disabled = true
            callback(null, agentUI)
          })
        })
      } else {
        callback(null, thePicoInp)
      }
    }

    var renderTab = function (event) {
      var whereSpec = location.hash.substring(1).split('-')
      var authenticated = event.data.authenticated
      $(this)
        .parent()
        .find('.active')
        .toggleClass('active')
      $(this).toggleClass('active')
      if (renderDemo) return // nothing to render for demos
      var tabName = $(this)
        .html()
        .toLowerCase()
        .trim()
      var $theSection = $(this)
        .parent()
        .next('.pico-section')
      var thePicoInpId = $(this)
        .parent()
        .parent()
        .prev()
        .attr('id')
      var thePicoInp = dbDump.pico[thePicoInpId]
      var thePicoInpName = $(this)
        .parent()
        .parent()
        .prev()
        .text()
        .trim()
      specDB(tabName, thePicoInp, thePicoInpName, function (err, theDB) {
        if (err) return window.alert('specDB error: ' + err)
        if (authenticated) {
          theDB.authenticated = authenticated
          theDB.authenticatedOwner = theDB.isOwner
          theDB.passwordAuthenticated = theDB.pswdAuth
        }
        var d = ''
        if (tabName === 'rulesets') {
          $theSection.html(rulesetsTemplate(theDB))
          d = theDB.pico_id + '-Rulesets'
          location.hash = d
          $theSection.on('change', '.js-toggle-pvars', function (e) {
            if (!e.target.checked) {
              return
            }
            var rid = $(e.target).parent().data('rid')
            var $ul = $(e.target).parent().find('ul')
            $.getJSON('/api/legacy-ui-get-vars/' + theDB.pico_id + '/' + rid, function (data) {
              data.forEach(function (v) {
                v.pico_id = theDB.pico_id
                v.rid = rid
                v.canDel = rid !== 'io.picolabs.wrangler' && rid !== 'io.picolabs.visual_params'
                v.val = JSON.stringify(v.val)
              })
              $ul.html(rulesetVarsTemplate(data))
            })
              .fail(function () {
                $ul.html('<li style="color:red">Error loading vars</li>')
              })
          })
          $theSection.find('.rulesetFromURL').submit(function (e) {
            var installAndAddRuleset = function (url, eci, callback) {
              var log = function (m) {
                $('.rfuops')
                  .append(m)
                  .append('\r\n')
              }
              var logProblem = function (m) {
                log('*Problem: ' + m)
                var $oplogDiv = $('.rfuops').parent()
                $oplogDiv.removeClass('oplog')
                $oplogDiv.find('button.oplog-x').click(function () {
                  $('.rfuops').text('')
                  $oplogDiv.addClass('oplog')
                })
              }
              log('Loading ruleset source code')
              log('URL: ' + url)
              picoAPI('/api/ruleset/register', { url: url }, 'GET', function (
                err,
                rr
              ) {
                if (!err && rr && rr.ok) {
                  log(rr.rid + ' registered')
                  log('Adding ' + rr.rid + ' to pico: ' + eci)
                  $.getJSON(
                    '/sky/event/' +
                      eci +
                      '/add-ruleset/wrangler/install_rulesets_requested' +
                      '?rid=' +
                      rr.rid,
                    function (ra) {
                      if (ra && ra.directives) {
                        log(rr.rid + ' added to pico')
                        callback()
                      } else {
                        logProblem('adding ' + rr.rid)
                      }
                    }
                  )
                } else {
                  if (err) {
                    logProblem(JSON.stringify(err))
                    if (err.data && err.data.error) log(err.data.error)
                  }
                  logProblem('registration failed')
                }
              })
            }
            e.preventDefault()
            var args = formToJSON(this)
            installAndAddRuleset(args.url, args.eci, function () {
              location.reload()
            })
          })
        } else if (tabName === 'testing') {
          $theSection.html(testingTemplate(theDB))
          $('.testing-rids li input').change(function (e) {
            $('#test-results pre').html('')
            if (this.checked) {
              var $label = $(this).next('.krlrid')
              let $editAnchor = $label.next('a')
              if ($editAnchor.next('ul').length === 0) {
                var rid = $label.text()
                var default_eci = theDB.eci
                var eci = $('#channels-'+theDB.pico_id).val()
                $.getJSON(
                  '/sky/cloud/' + default_eci + '/' + rid + '/__testing',
                  function (c) {
                    $editAnchor.after(
                      capTemplate({ eci: eci, rid: rid, capabilities: c })
                    )
                  }
                ).fail(function () {
                  $editAnchor.after('<ul></ul>')
                })
              }
            }
          })
          location.hash = theDB.pico_id + '-Testing'
        } else if (tabName === 'about') {
          $theSection.html(aboutTemplate(theDB))
          $theSection
            .find('.use-minicolors')
            .minicolors({
              swatches: '#ccc|#fcc|#7fffd4|#ccf|#ffc|#87CEFA|#fcf'.split('|')
            })
          $('.minicolors-input-swatch').css('top', 0)
          $('.minicolors-input-swatch').css('left', 0)
          d = theDB.pico_id + '-About'
          location.hash = d
        } else if (tabName === 'channels') {
          $theSection.html(channelsTemplate(theDB))
          d = theDB.pico_id + '-Channels'
          location.hash = d
        } else if (tabName === 'subscriptions') {
          $theSection.html(subscriptionsTemplate(theDB))
          d = theDB.pico_id + '-Subscriptions'
          location.hash = d
        } else if (tabName === 'policies') {
          $theSection.html(policiesTemplate(theDB))
          d = theDB.pico_id + '-Policies'
          location.hash = d
        } else if (tabName === 'agent') {
          var routerUsedCount = 0
          if (theDB.ui && theDB.ui.routerUI) {
            if (theDB.ui.routerUI.routerName && theDB.ui.connections) {
              var toSuffix = " to " + theDB.ui.name
              for (var ic=0; ic < theDB.ui.connections.length; ++ic) {
                var rConnName = theDB.ui.connections[ic].label + toSuffix
                if (theDB.ui.routerUI.routerConnections && theDB.ui.routerUI.routerConnections[rConnName]) {
                  theDB.ui.connections[ic].routerName = theDB.ui.routerUI.routerName
                  ++routerUsedCount
                }
              }
            }
            theDB.ui.routerUI.unused = routerUsedCount == 0
          }
          theDB.text = JSON.stringify(theDB.ui, undefined, 2)
          $theSection.html(agentTemplate(theDB))
          d = theDB.pico_id + '-Agent'
          if (whereSpec.length > 2) {
            var $theLi = $('li#' + whereSpec[2])
            $theLi.find('input').first().trigger('click')
            var theScroller = $theLi.closest('.pico-section').get(0)
            theScroller.scrollTop = $theLi.outerHeight() - 300
            setTimeout(function(){
              $theLi.find('button').first().prev().focus()
            },300)
          } else {
            location.hash = d
          }
          $('#connection-list li > input').click(function() {
            var base_hash = location.hash.substring(0,32)
            if (this.checked) {
              location.hash = base_hash + '-' + $(this).parent().attr('id')
            } else {
              location.hash = base_hash
            }
          })
        } else if (tabName === 'logging') {
          $theSection.html(loggingTemplate(theDB))
          if (theDB.status) {
            $('#logging-list').show()
            if (theDB.logs) {
              $('#episode_limit').val(Object.keys(theDB.logs).length)
            }
          }
          d = theDB.pico_id + '-Logging'
          location.hash = d
          tabId = '#loggingTab-' + theDB.pico_id
          $('#logging-on').click(function () {
            $.getJSON(
              '/sky/event/' + theDB.eci + '/logging-on/picolog/begin',
              function () {
                $(tabId).trigger('click')
                $('#logging-list').fadeIn()
              }
            )
          })
          $('#logging-off').click(function () {
            $('#logging-list').hide()
            $.getJSON(
              '/sky/event/' + theDB.eci + '/logging-off/picolog/reset',
              function () {
                $(tabId).trigger('click')
              }
            )
          })
        }
        $theSection.find('.js-ajax-form').submit(function (e) {
          e.preventDefault()
          $.getJSON($(this).attr('action'), formToJSON(this), function () {
            if (location.hash !== d && location.hash.length <= d.length) {
              location.hash = d
            }
            location.reload()
          })
        })
        $theSection.find('.js-ajax-link').click(function (e) {
          e.preventDefault()
          $.getJSON($(this).attr('href'), {}, function () {
            if (location.hash !== d) {
              location.hash = d
            }
            location.reload()
          })
        })
        $theSection.find('.js-nav').click(function (e) {
          e.preventDefault()
          var d = $(this)
            .attr('href')
            .substring(1)
          if (location.hash !== d) {
            location.hash = d
          }
          $(this).closest('.pico-edit').find('button.x').click()
          $('#'+d.substr(0,25)).click()
        })
        var $theResultsPre = $theSection.find('div#test-results pre')
        $theSection.off('submit').on('submit', 'form.js-test', function (e) {
          e.preventDefault()
          $.ajax($(this).attr('action'), {
            type: $(this).attr('method'),
            data: formToJSON(this),
            success: function (ans) {
              $theResultsPre.html(JSON.stringify(ans,undefined,2).escapeHTML())
            },
            dataType: 'json'
          }).fail(function (err) {
            $theResultsPre.html(
              '<span style="color:red">' +
                JSON.stringify(err, undefined, 2).escapeHTML() +
                '</span>'
            )
          })
        })
      })
    }
    var findEciById = function (id) {
      return dbDump.pico[id].admin_eci
    }
    //
    // /////////////////////////////////////////////////////////////////////////
    //
    var renderGraph = function (data, authenticated) {
      if (authenticated) {
        data.authenticated = true
      }
      $('body').html(uiTemplate(data))
      document.title = $('body h1').html()
      if (data.picos && data.picos[0]) {
        $('#user-logout span').html(data.picos[0].dname)
        if (authenticated) {
          document.title = data.picos[0].dname
        }
      }
      $('div.pico')
        .resizable({
          maxHeight: 200,
          maxWidth: 200,
          minHeight: 50,
          minWidth: 50,
          resize: dragmove,
          stop: function (event, ui) {
            if (!renderDemo) {
              var nodeId = ui.helper[0].getAttribute('id')
              var width = Math.round(ui.size.width)
              var height = Math.round(ui.size.height)
              $.getJSON('/sky/event/' + findEciById(nodeId) + '/25/visual/config', {
                width: width,
                height: height
              })
            }
          }
        })
        .draggable({ containment: 'parent', drag: dragmove, stop: dragstop })
        .click(function () {
          var fadeOutOptions = {
            width: $(this).css('width'),
            height: $(this).css('height'),
            top: $(this).css('top'),
            left: $(this).css('left')
          }
          var $pediv = $(this).next('.pico-edit')
          var prevTitle = document.title
          var fadeAway = function (ev) {
            document.title = prevTitle
            $pediv.find('button.x').remove()
            $pediv.animate(fadeOutOptions, 200)
            $pediv.fadeOut(200)
            ev.stopPropagation()
            location.hash = ''
          }
          document.title = $(this).text()
          $pediv.fadeIn(200)
          $pediv.animate({
            width: '95%',
            height: '85%',
            top: 0,
            left: 0
          }, 200, function () {
            $pediv.prepend('<button class="x">&ndash;</button>')
            $pediv.find('button.x').click(fadeAway)
          })
          var $horizMenu = $pediv.find('ul.horiz-menu')
          if ($horizMenu.find('li.active').length === 0
            && location.hash.length <= 1) {
            $horizMenu.find('li:first').trigger('click')
          }
        })
        .each(function () {
          updateEdges($(this).attr('id'))
        })
        .parent()
        .find('ul.horiz-menu li')
        .click({ authenticated: authenticated }, renderTab)
      var whereSpec = location.hash.substring(1).split('-')
      if (whereSpec.length > 0 && whereSpec[0]) {
        $('div#' + whereSpec[0]).trigger('click')
      }
      if (whereSpec.length > 1) {
        $('div#' + whereSpec[0])
          .next('.pico-edit')
          .find('ul li:contains(' + whereSpec[1] + ')')
          .trigger('click')
      }
    }
    var get = function (o, p, v) { // adapted from lodash.get, with thanks
      var i = 0

      var l = p.length
      while (o && i < l) {
        o = o[p[i++]]
      }
      return o || v
    }
    var getP = function (p, n, d) {
      if (p === undefined) return d
      return get(dbDump.pico, [p.id, 'io.picolabs.wrangler', 'vars', n], d)
    }
    var getV = function (p, n, d) {
      if (p === undefined) return d
      return get(
        dbDump.pico,
        [p.id, 'io.picolabs.visual_params', 'vars', n],
        d
      )
    }
    var rootPico = {}
    for (var k in dbDump.pico) {
      rootPico.id = k
      rootPico.eci = findEciById(k)
      break
    }
    var agents = false
    dbDump.enabledRIDs.forEach(function (rid) {
      if (rid === "org.sovrin.agent") {
        agents = true
      }
    })
    var doMainPage = function (ownerPico, authenticated) {
      var dbGraph = {}
      dbGraph.agents = agents
      dbGraph.title = getV(ownerPico, 'title', 'My Picos')
      dbGraph.descr = getV(
        ownerPico,
        'descr',
        'These picos are hosted on this pico engine.'
      )
      dbGraph.picos = []
      dbGraph.chans = []
      var yiq = function (hexcolor) {
        if (hexcolor.startsWith('#') && hexcolor.length === 7) {
          var r = parseInt(hexcolor.substr(1, 2), 16)
          var g = parseInt(hexcolor.substr(3, 2), 16)
          var b = parseInt(hexcolor.substr(5, 2), 16)
          return r * 0.299 + g * 0.587 + b * 0.114
        } else {
          return 255
        }
      }
      var contrast = function (hexcolor) {
        var luma = yiq(hexcolor)
        if (luma < 32) return '#CCCCCC'
        else if (luma < 128) return '#FFFFFF'
        else if (luma < 224) return '#000000'
        else return '#333333'
      }
      var walkPico = function (pico, dNumber, dLeft, dTop) {
        pico.dname = getV(
          pico,
          'dname',
          dNumber ? 'Child ' + dNumber : 'Root Pico'
        )
        var width = getV(pico, 'width', undefined)
        var height = getV(pico, 'height', 100)
        var left = Math.floor(parseFloat(getV(pico, 'left', dLeft)))
        var top = Math.floor(parseFloat(getV(pico, 'top', dTop)))
        var color = getV(
          pico,
          'color',
          dNumber ? 'aquamarine' : 'lightskyblue'
        )
        pico.style = getV(
          pico,
          'style',
          (width ? 'width:' + width + 'px;' : '') +
            'height:' +
            height +
            'px;' +
            'left:' +
            left +
            'px;' +
            'top:' +
            top +
            'px;' +
            'background-color:' +
            color +
            ';' +
            'color:' +
            contrast(color)
        )
        dbGraph.picos.push(pico)
        var children = getP(pico, 'children', [])
        var i = 0

        var l = children.length
        for (; i < l; ++i) {
          if (dbDump.pico[children[i].id] === undefined) continue
          var cp = { id: children[i].id }
          dbGraph.chans.push({
            class: pico.id + '-origin ' + cp.id + '-target'
          })
          var limitI = Math.min(i, 45)
          walkPico(cp, dNumber * 10 + i + 1, left + limitI * 10 + 20, top + 20)
        }
        var subscriptions = get(dbDump.pico, [
          pico.id,
          'io.picolabs.subscription',
          'vars',
          'established'
        ])
        if (subscriptions) {
          for (var k in subscriptions) {
            var subsECI = get(subscriptions, [k, 'Tx'])
            if (subsECI) {
              var subsId = get(dbDump.channel, [subsECI, 'pico_id'])
              if (subsId) {
                dbGraph.chans.push({
                  class: pico.id + '-origin ' + subsId + '-target subscription'
                })
              }
            }
          }
        }
      }
      walkPico(ownerPico, 0, '300', '50')
      renderGraph(dbGraph, authenticated)
      $.getJSON('/api/engine-version', function (data) {
        $('#version').text(data ? data.version : 'undefined')
      })
      $('#user-logout a').click(function (e) {
        e.preventDefault()
        sessionStorage.removeItem('owner_pico_id')
        sessionStorage.removeItem('owner_pico_eci')
        location.reload()
      })
    }
    var loggedInPico = {
      id: sessionStorage.getItem('owner_pico_id'),
      eci: sessionStorage.getItem('owner_pico_eci')
    }
    var noLoginRequired = function () {
      sessionStorage.removeItem('owner_pico_id')
      sessionStorage.removeItem('owner_pico_eci')
      doMainPage(rootPico)
    }
    if (renderDemo) {
      $.getJSON(jsonName + '.json', renderGraph)
      $.getJSON('/api/engine-version', function (data) {
        $('#version').text(data ? data.version : 'undefined')
      })
    } else if (loggedInPico.id) {
      doMainPage(loggedInPico, true)
    } else {
      if (typeof handlePicoLogin === 'function') {
        $.post(
          '/sky/event/' + rootPico.eci + '/none/owner/eci_requested',
          function (d) {
            if (
              d &&
              d.directives &&
              d.directives[0] &&
              d.directives[0].options
            ) {
              handlePicoLogin(d.directives[0].options, formToJSON, function (
                authenticatedPico
              ) {
                doMainPage(authenticatedPico, true)
              })
            } else {
              noLoginRequired()
            }
          }
        ).fail(noLoginRequired)
      } else {
        noLoginRequired()
      }
    }
  })
})

function groupLogsByEpisode (logs) {
  var entries = []
  logs.forEach(function (entry) {
    if (entry) {
      entries.push({
        txn_id: entry.txn_id,
        msg: entry.time + ' [' + (entry.krl_level + '').toUpperCase() + '] ' + entry.msg,
        time: new Date(entry.time)
      })
    }
  })
  entries.sort(function (a, b) {
    return a.time.getTime() - b.time.getTime()
  })
  var groups = {}
  entries.forEach(function (entry) {
    if (!groups[entry.txn_id]) {
      groups[entry.txn_id] = []
    }
    groups[entry.txn_id].push(entry.msg)
  })
  var groupByHead = {}
  Object.keys(groups).forEach(function (txnId) {
    var head = groups[txnId][0].replace(/\[EPISODE_START\]/, '|')
    groupByHead[head] = groups[txnId]
  })
  var groupsSorted = {}
  var groupOrder = Object.keys(groupByHead)
  groupOrder.sort().reverse()
  groupOrder.forEach(function (header) {
    groupsSorted[header] = groupByHead[header]
  })
  return groupsSorted
}
