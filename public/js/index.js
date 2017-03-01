$(document).ready(function() {
  var json_name = location.search.substring(1);
  var renderDemo = (json_name.length > 0);
  var leftRadius = function(nodeId) {
    var theNode = $('#'+nodeId);
    return Math.floor(
             (parseFloat(theNode.css('border-left'))
             +parseFloat(theNode.css('padding-left'))
             +parseFloat(theNode.css('width'))
             +parseFloat(theNode.css('padding-right'))
             +parseFloat(theNode.css('border-right'))
             )/2);
  }
  var topRadius = function(nodeId) {
    var theNode = $('#'+nodeId);
    return Math.floor(
             (parseFloat(theNode.css('border-top'))
             +parseFloat(theNode.css('padding-top'))
             +parseFloat(theNode.css('height'))
             +parseFloat(theNode.css('padding-bottom'))
             +parseFloat(theNode.css('border-bottom'))
             )/2);
  }
  var updateLines = function(nodeId,theLeft,theTop) {
    var lR = leftRadius(nodeId);
    var tR = topRadius(nodeId);
    $('.'+nodeId+'-origin').attr({x1:theLeft+lR+'px',y1:theTop+tR+'px'});
    $('.'+nodeId+'-target').attr({x2:theLeft+lR+'px',y2:theTop+tR+'px'});
  }
  var updateEdges = function(nodeId) {
    var theLeft = parseFloat($('#'+nodeId).css('left'));
    var theTop = parseFloat($('#'+nodeId).css('top'));
    updateLines(nodeId,theLeft,theTop);
  }
  var dragmove = function(event,ui) {
    var nodeId = ui.helper[0].getAttribute("id");
    updateLines(nodeId,ui.position.left,ui.position.top);
  }
  var formToJSON = function(form){
    var json = {};
    $.each($(form).serializeArray(), function(key, elm){
      json[elm.name] = elm.value;
    });
    return json;
  };
  var getCapabilities = function(eci,rid,callback) {
    var ans = { "eci":eci, "rid":rid, "capabilities":{} };
    $.getJSON("/sky/cloud/"+eci+"/"+rid+"/__testing",function(c){
      ans.capabilities = c;
      callback(ans);
    }).fail(function(){
      callback(ans);
    });
  };
  var parMap = function (arr, visitor, done) {
    var count = 0;
    var target = arr.length;
    var outp = new Array(target);
    var maybeDone = function (index,result) {
      outp[index] = result;
      if (++count === target) {
        done(outp);
      }
    }
    for (var i=0; i<target; ++i) {
      visitor(arr[i], maybeDone.bind(null,i));
    }
  };
$.getJSON("/api/db-dump", function(db_dump){
  var dragstop = function(event,ui) {
    var nodeId = ui.helper[0].getAttribute("id");
    $('#'+nodeId).next(".pico-edit").css('left',ui.position.left)
                                    .css('top',ui.position.top);
    if(!renderDemo) {
      $.getJSON(
        "/sky/event/"+findEciById(nodeId)+"/drag_pico/visual/moved",
        { left: ui.position.left, top: ui.position.top });
    }
  }
  var fadeInOptions = {
    width: "95%",
    height: "85%",
    top: 0,
    left: 0 };
  var fadeOutOptions;
  //specialize the db for the particular tab
  var specDB = function($li,callback) {
    var label = $li.html();
    var thePicoInp = db_dump.pico[$li.parent().parent().prev().attr("id")];
    var eci = findEciById(thePicoInp.id);
    if (label === "About") {
      var thePicoOut = {};
      thePicoOut.id = thePicoInp.id;
      thePicoOut.eci = eci;
      var pp = getP(thePicoInp,"parent",undefined);
      if (pp) {
        thePicoOut.parent = {};
        thePicoOut.parent.id = pp.id;
        thePicoOut.parent.eci = pp.eci;
        thePicoOut.parent.dname = getV(pp,"dname",undefined);
      }
      thePicoOut.children = [];
      var reportedChildren = getP(thePicoInp,"children",[]);
      var i = 0;
      var cLen = reportedChildren.length;
      for (; i<cLen; ++i) {
        var p = reportedChildren[i];
        var cp = {}; cp.id = p.id; cp.eci = p.eci;
        if (db_dump.pico[p.id] === undefined) continue;
        cp.dname = getV(p,"dname",undefined);
        cp.canDel = getP(p,"children", []).length == 0; 
        thePicoOut.children.push(cp);
      }
      thePicoOut.dname = getV(thePicoInp,"dname",
                              $li.parent().parent().prev().text());
      thePicoOut.color = getV(thePicoInp,"color",
                              thePicoOut.parent?"#7FFFD4":"#87CEFA");
      callback(thePicoOut);
    } else if (label === "Rulesets") {
      var theRulesetInp = thePicoInp;
      var installedRS = {};
      for (var rs in theRulesetInp.ruleset) {
        installedRS[rs] = theRulesetInp.ruleset[rs];
        if (rs !== "io.picolabs.pico" && rs !== "io.picolabs.visual_params") {
          installedRS[rs].canDel = true;
        }
        if (theRulesetInp[rs]) {
          var theVarsInp = theRulesetInp[rs].vars;
          var theVarsOut = {};
          for (var ent in theVarsInp) {
            theVarsOut[ent] = JSON.stringify(theVarsInp[ent]);
          }
          installedRS[rs].vars = theVarsOut;
        }
      }
      var avail = [];
      if (db_dump.rulesets){
        for (var rid in db_dump.rulesets.enabled) {
          if (installedRS[rid] === undefined) {
            avail.push(rid);
          }
        }
      }
      var theRulesetOut = {
        "pico_id": thePicoInp.id,
        "eci": eci,
        "installed": installedRS,
        "avail" : avail };
      callback(theRulesetOut);
    } else if (label === "Logging") {
      var logRID = "io.picolabs.logging";
      var theLoggingOut = {};
      if (get(db_dump,["pico",thePicoInp.id,"ruleset",logRID,"on"])) {
        var theLoggingVars = get(db_dump,["pico",thePicoInp.id,logRID,"vars"]);
        theLoggingOut.status = theLoggingVars.status;
        theLoggingOut.logs = theLoggingVars.logs;
        theLoggingOut.eci = eci;
      } else {
        theLoggingOut.disabled = true;
      }
      callback(theLoggingOut);
    } else if (label === "Testing") {
      var eci = findEciById(thePicoInp.id);
      var theRids = [];
      for (var rid in thePicoInp.ruleset) {
        theRids.push(rid);
      }
      parMap(theRids,
             getCapabilities.bind(null,eci),
             function (theCapabilities) {
               callback({ "testing": theCapabilities,
                          "pico_id": thePicoInp.id });
             });
    } else if (label === "Channels") {
      var theChannels = [];
      var theECI;
      Object.keys(thePicoInp.channel).forEach(function(id){
        var aChannel = get(thePicoInp,["channel",id],undefined);
        if (aChannel) {
          if (theECI) {
            aChannel.canDel = true;
          } else {
            theECI = id;
          }
          theChannels.push(aChannel);
        }
      });
      callback({ "id": thePicoInp.id, "channel": theChannels });
    } else {
      callback(thePicoInp);
    }
  }
  var displayKrl = function() {
    window.open("/ruleset.html#"+$(this).html(),"ruleset").location.reload();
  }
  var renderTab =
    function(){
      $(this).parent().find('.active').toggleClass('active');
      $(this).toggleClass('active');
      if(renderDemo) return; // nothing to render for demos
      var liContent = $(this).html().toLowerCase();
      var tabTemplate = Handlebars.compile($('#'+liContent+'-template').html());
      var $theSection = $(this).parent().next('.pico-section');
      specDB($(this),function(theDB){
      $theSection.html(tabTemplate(theDB));
      var d = "";
      if(liContent === "rulesets") {
        $(".pico-edit .krlrid").click(displayKrl);
        d = theDB.pico_id+"-Rulesets";
        location.hash = d;
        $theSection.find('.rulesetFromURL').submit(function(e){
  var installAndAddRuleset = function(url,eci,callback){
    var log = function(m) {
      $(".rfuops").append(m).append("\r\n");
    }
    var logProblem = function(m) {
      log("*Problem: "+m);
      var $oplogDiv = $(".rfuops").parent();
      $oplogDiv.removeClass("oplog");
      $oplogDiv.find("button.oplog-x").click(function(){
        $(".rfuops").text("");
        $oplogDiv.addClass("oplog");
      });
    }
    log("Loading ruleset source code");
    log("URL: "+url);
    $.getJSON("/api/ruleset/register",{"url": url},function(rr){
      if (rr && rr.ok) {
        log(rr.rid+" registered");
        log("Adding "+rr.rid+" to pico: "+eci);
        $.getJSON(
          "/sky/event/"+eci+"/add-ruleset/pico/new_ruleset"
            +"?rid="+rr.rid,
          function(ra){
            if (ra && ra.directives) {
              log(rr.rid+" added to pico");
              callback();
            } else {
              logProblem("adding "+rr.rid);
            }
        });
      } else {
        logProblem("registering");
      }
    });
  };
          e.preventDefault();
          var args = formToJSON(this);
          installAndAddRuleset(args.url,args.eci,function(){
            location.reload();
          });
        });
      } else if(liContent === "testing") {
        $(".pico-edit .krlrid").click(displayKrl);
        location.hash = theDB.pico_id+"-Testing";
      } else if(liContent === "about") {
        $theSection.find('.use-minicolors').minicolors(
          { swatches: "#ccc|#fcc|#7fffd4|#ccf|#ffc|#87CEFA|#fcf".split('|')});
        $('.minicolors-input-swatch').css('top',0);
        $('.minicolors-input-swatch').css('left',0);
        d = theDB.id+"-About";
      } else if(liContent === "channels") {
        d = theDB.id+"-Channels";
      } else if(liContent === "logging") {
        $("#logging-on").click(function(){
          $.getJSON("/sky/event/"+theDB.eci+"/logging-on/picolog/begin",function(){
            $("#logging-list").fadeIn();
          });
        });
        if (theDB.status) {
          $("#logging-list").show();
        }
        $("#logging-off").click(function(){
          $("#logging-list").hide();
          $.getJSON("/sky/event/"+theDB.eci+"/logging-on/picolog/reset",function(){ });
        });
      }
      $theSection.find('.js-ajax-form').submit(function(e){
        e.preventDefault();
        $.getJSON($(this).attr("action"),formToJSON(this),function(){
            if (location.hash !== d) {
              location.hash = d;
            }
            location.reload();
        });
      });
      $theSection.find('.js-ajax-link').click(function(e){
        e.preventDefault();
        $.getJSON($(this).attr("href"),{},function(){
            if (location.hash !== d) {
              location.hash = d;
            }
            location.reload();
        });
      });
      $theSection.find('.js-nav').click(function(e){
        e.preventDefault();
        var d = $(this).attr("href").substring(1);
        if (location.hash !== d) {
          location.hash = d;
        }
        location.reload();
      });
      var $theResultsPre = $theSection.find('div#test-results pre');
      $theSection.find('form.js-test').submit(function(e){
        e.preventDefault();
        $.getJSON($(this).attr("action"),formToJSON(this),function(ans){
          $theResultsPre.html(JSON.stringify(ans,undefined,2));
        }).fail(function(err){
          $theResultsPre.html(
            "<span style=\"color:red\">"
            + JSON.stringify(err,undefined,2)
            + "</span>");
        });
      });
      });
    };
  var mpl = Handlebars.compile($('#the-template').html());
  var findEciById = function(id) {
    var thePicoInp = db_dump.pico[id];
    for (var channel in thePicoInp.channel) {
      return channel;
    }
    return id;
  }
  var resizeOptions = {
    maxHeight: 200,
    maxWidth: 200,
    minHeight: 50,
    minWidth: 50,
    resize: dragmove,
    stop: function(event,ui) {
      if(!renderDemo) {
        var nodeId = ui.helper[0].getAttribute("id");
        $.getJSON(
          "/sky/event/"+findEciById(nodeId)+"/25/visual/config",
          { width: ui.size.width, height: ui.size.height });
      }
    }
  };
  var renderGraph =
     function(data){
       $('body').html(mpl(data));
       document.title = $('body h1').html();
       $('div.pico')
         .resizable(resizeOptions)
         .draggable({ containment: "parent", drag: dragmove, stop: dragstop })
         .click(function(){
                  fadeOutOptions = {
                    width: $(this).css('width'),
                    height: $(this).css('height'),
                    top: $(this).css('top'),
                    left: $(this).css('left') };
                  var $pediv = $(this).next('.pico-edit');
                  var fadeAway = function(ev) {
                                   $pediv.find('button.x').remove();
                                   $pediv.animate(fadeOutOptions);
                                   $pediv.fadeOut();
                                   ev.stopPropagation();
                                   location.hash = "";
                                 };
                  $pediv.fadeIn();
                  $pediv.animate(fadeInOptions,
                                 function(){
                                   $pediv.prepend("<button class=\"x\">&ndash;</button>");
                                   $pediv.find('button.x').click(fadeAway);
                                 });
                  var $horizMenu = $pediv.find('ul.horiz-menu');
                  if ($horizMenu.find('li.active').length === 0) {
                    $horizMenu.find('li:first').trigger('click');
                  }
                })
         .each(function(){updateEdges($(this).attr("id"))})
         .parent().find('ul.horiz-menu li').click(renderTab);
       var whereSpec = location.hash.substring(1).split("-");
       if (whereSpec.length > 0 && whereSpec[0]) {
         $('div#'+whereSpec[0]).trigger('click');
       }
       if (whereSpec.length > 1) {
         $('div#'+whereSpec[0]).next('.pico-edit')
           .find('ul li:contains('+whereSpec[1]+')').trigger('click');
       }
     };
  if (renderDemo) {
    $.getJSON( json_name + ".json", renderGraph);
  } else {
    var get = // adapted from lodash.get, with thanks
      function(o,p,v) {
        var i=0, l=p.length;
        while(o && i<l) { o = o[p[i++]]; }
        return o ? o : v;
      }
    var getP = function(p,n,d) {
      if (p === undefined) return d;
      return get(db_dump.pico,[p.id,"io.picolabs.pico","vars",n],d);
    }
    var getV = function(p,n,d) {
      if (p === undefined) return d;
      return get(db_dump.pico,[p.id,"io.picolabs.visual_params","vars",n],d);
    }
    var db_graph = {};
    var ownerPico = {};
    for (var k in db_dump.pico) { ownerPico.id = k; break; }
    db_graph.title = getV(ownerPico,"title","My Picos");
    db_graph.descr = getV(ownerPico,"descr", "These picos are hosted on this pico engine.");
    db_graph.picos = [];
    db_graph.chans = [];
    var walkPico =
      function(pico,dNumber,dLeft,dTop){
        pico.dname = getV(pico,"dname",dNumber?"Child "+dNumber:"Owner Pico");
        var width = getV(pico,"width",undefined);
        var height = getV(pico,"height",100);
        var left = Math.floor(parseFloat(getV(pico,"left",dLeft)));
        var top = Math.floor(parseFloat(getV(pico,"top",dTop)));
        var color = getV(pico,"color",dNumber?"aquamarine":"lightskyblue");
        pico.style = getV(pico,"style",
          (width?"width:"+width+"px;":"")
          +"height:"+height+"px;"
          +"left:"+left+"px;"
          +"top:"+top+"px;"
          +"background-color:"+color);
        db_graph.picos.push(pico);
        var children = getP(pico,"children",[]);
        var i=0, l=children.length;
        for (;i<l;++i) {
          if (db_dump.pico[children[i].id] === undefined) continue;
          var cp = { id: children[i].id };
          db_graph.chans.push({ class: pico.id +"-origin "+ cp.id +"-target" });
          var limitI = Math.min(i,45);
          walkPico(cp,dNumber*10+i+1,left+(limitI*10)+20,top+20);
        }
      }
    walkPico(ownerPico,0,"300","50");
    renderGraph(db_graph);
    $.getJSON("/api/engine-version",function(data){
      $("#version").text(data ? data.version : "undefined");
    });
  }
});
});
