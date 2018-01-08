$(document).ready(function() {
  var json_name = location.search.substring(1);
  var renderDemo = (json_name.length > 0);
  if (!String.prototype.escapeHTML) {
    String.prototype.escapeHTML = function() {
      return this.replace(/&/g,"&amp;").replace(/</g,"&lt;");
    };
  }
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
  var springLine = function() {
    var $line = $(this);
    var x1 = parseInt($line.attr("x1"));
    var x2 = parseInt($line.attr("x2"));
    var y1 = parseInt($line.attr("y1"));
    var y2 = parseInt($line.attr("y2"));
    if(!x1 || !x2 || !y1 || !y2) return;//incomplete line
    var lng = Math.sqrt(Math.pow((x2-x1),2)+Math.pow((y2-y1),2));
    if(lng>1200) lng = 1200;   //min stroke width 4.5
    else if(lng<100) lng = 100;//min dash spacing 0.5
    $line.css("strokeWidth",((1200-lng)/200)+4.5);
    $line.css("strokeDasharray","2,"+(lng/200));
  }
  var updateLines = function(nodeId,theLeft,theTop) {
    var lR = leftRadius(nodeId);
    var tR = topRadius(nodeId);
    $('.'+nodeId+'-origin').attr({x1:theLeft+lR+'px',y1:theTop+tR+'px'});
    $('.'+nodeId+'-target').attr({x2:theLeft+lR+'px',y2:theTop+tR+'px'});
    $('line.subscription').each(springLine);
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
  var capTemplate = Handlebars.compile($('#capabilities-template').html());
$.getJSON("/api/db-dump?legacy=true", function(db_dump){
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
      var pp_eci = getP(thePicoInp,"parent_eci",undefined);
      var pp = pp_eci ? {id:get(db_dump.channel,[pp_eci,"pico_id"]),eci:pp_eci}
                      : undefined;
      if (pp && pp.id != rootPico.id) {
        thePicoOut.parent = {};
        thePicoOut.parent.id = pp.id;
        thePicoOut.parent.eci = pp.eci;
        thePicoOut.parent.dname = getV(pp,"dname",undefined);
      }
      if (thePicoInp.id == rootPico.id || (pp && pp.id == rootPico.id)) {
        thePicoOut.owner = true;
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
                              $li.parent().parent().prev().text().trim());
      thePicoOut.color = getV(thePicoInp,"color",
                              thePicoOut.parent?"#7FFFD4":"#87CEFA");
      callback(thePicoOut);
    } else if (label === "Rulesets") {
      var theRulesetInp = thePicoInp;
      var installedRS = {};
      for (var rs in theRulesetInp.ruleset) {
        installedRS[rs] = theRulesetInp.ruleset[rs];
        if (rs !== "io.picolabs.wrangler" && rs !== "io.picolabs.visual_params") {
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
      var testing = [];
      var eci = findEciById(thePicoInp.id);
      for (var rid in thePicoInp.ruleset) {
        testing.push({"rid":rid});
      }
      callback({"pico_id": thePicoInp.id, "eci":eci, "testing":testing});
    } else if (label === "Channels") {
      var theChannels = [];
      Object.keys(thePicoInp.channel).forEach(function(id){
        var aChannel = get(thePicoInp,["channel",id],undefined);
        if (aChannel) {
          if (aChannel.type!="secret" || aChannel.name!="admin") {
            aChannel.canDel = true;
          }
          theChannels.push(aChannel);
        }
      });
      callback({ "id": thePicoInp.id, "channel": theChannels });
    } else if (label == "Subscriptions") {
      var theSubscriptions = {};
      var subscriptions = get(db_dump.pico,[thePicoInp.id,"io.picolabs.subscription","vars","subscriptions"]);
      if (subscriptions) {
        Object.keys(subscriptions).forEach(function(id){
          theSubscriptions[id] = JSON.stringify(subscriptions[id],undefined,2);
        });
      }
      callback({"subscriptions":theSubscriptions});
    } else {
      callback(thePicoInp);
    }
  }
  var displayKrl = function() {
    window.open("ruleset.html#"+$(this).html(),"ruleset").location.reload();
  }
  var renderTab =
    function(event){
      var authenticated = event.data.authenticated;
      $(this).parent().find('.active').toggleClass('active');
      $(this).toggleClass('active');
      if(renderDemo) return; // nothing to render for demos
      var liContent = $(this).html().toLowerCase();
      var tabTemplate = Handlebars.compile($('#'+liContent+'-template').html());
      var $theSection = $(this).parent().next('.pico-section');
      specDB($(this),function(theDB){
      if(authenticated) {
        theDB.authenticated = authenticated;
      }
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
    picoAPI("/api/ruleset/register",{"url":url},"GET",function(err, rr){
      if (!err && rr && rr.ok) {
        log(rr.rid+" registered");
        log("Adding "+rr.rid+" to pico: "+eci);
        $.getJSON(
          "/sky/event/"+eci+"/add-ruleset/wrangler/new_ruleset"
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
        if(err){
          logProblem(JSON.stringify(err));
          if(err.data && err.data.error) log(err.data.error);
        }
        logProblem("registration failed");
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
        $(".testing-rids li input").change(function(e){
          $("#test-results pre").html("");
          if(this.checked){
            var $span = $(this).next(".krlrid");
            if($span.next().length==0){
              var rid = $span.text();
              var eci = theDB.eci;
              $.getJSON("/sky/cloud/"+eci+"/"+rid+"/__testing",function(c){
                $span.after(capTemplate({eci:eci,rid:rid,capabilities:c}));
              }).fail(function(){$span.after("<ul></ul>");
              });
            }
          }
        });
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
      $theSection.off("submit").on("submit","form.js-test",function(e){
        e.preventDefault();
        $.getJSON($(this).attr("action"),formToJSON(this),function(ans){
          $theResultsPre.html(JSON.stringify(ans,undefined,2).escapeHTML());
        }).fail(function(err){
          $theResultsPre.html(
            "<span style=\"color:red\">"
            + JSON.stringify(err,undefined,2).escapeHTML()
            + "</span>");
        });
      });
      });
    };
  var mpl = Handlebars.compile($('#the-template').html());
  var findEciById = function(id) {
    return db_dump.pico[id].admin_eci;
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
        var width = Math.round(ui.size.width);
        var height = Math.round(ui.size.height);
        $.getJSON(
          "/sky/event/"+findEciById(nodeId)+"/25/visual/config",
          { width: width, height: height });
      }
    }
  };
  var renderGraph =
     function(data,authenticated){
       if(authenticated) {
         data.authenticated = true;
       }
       $('body').html(mpl(data));
       document.title = $('body h1').html();
       if (data.picos && data.picos[0]) {
         $("#user-logout span").html(data.picos[0].dname);
       }
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
                                   $pediv.animate(fadeOutOptions,200);
                                   $pediv.fadeOut(200);
                                   ev.stopPropagation();
                                   location.hash = "";
                                 };
                  $pediv.fadeIn(200);
                  $pediv.animate(fadeInOptions,200,
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
         .parent().find('ul.horiz-menu li').click(
           {authenticated:authenticated},
           renderTab);
       var whereSpec = location.hash.substring(1).split("-");
       if (whereSpec.length > 0 && whereSpec[0]) {
         $('div#'+whereSpec[0]).trigger('click');
       }
       if (whereSpec.length > 1) {
         $('div#'+whereSpec[0]).next('.pico-edit')
           .find('ul li:contains('+whereSpec[1]+')').trigger('click');
       }
     };
  var get = // adapted from lodash.get, with thanks
    function(o,p,v) {
      var i=0, l=p.length;
      while(o && i<l) { o = o[p[i++]]; }
      return o ? o : v;
    }
  var getP = function(p,n,d) {
    if (p === undefined) return d;
    return get(db_dump.pico,[p.id,"io.picolabs.wrangler","vars",n],d);
  }
  var getV = function(p,n,d) {
    if (p === undefined) return d;
    return get(db_dump.pico,[p.id,"io.picolabs.visual_params","vars",n],d);
  }
  var rootPico = {};
  for (var k in db_dump.pico) {
    rootPico.id = k;
    rootPico.eci = findEciById(k);
    break;
  }
  var do_main_page = function(ownerPico,authenticated) {
    var db_graph = {};
    db_graph.title = getV(ownerPico,"title","My Picos");
    db_graph.descr = getV(ownerPico,"descr", "These picos are hosted on this pico engine.");
    db_graph.picos = [];
    db_graph.chans = [];
    var yiq = function(hexcolor){
      if (hexcolor.startsWith("#") && hexcolor.length === 7) {
        var r = parseInt(hexcolor.substr(1,2),16);
        var g = parseInt(hexcolor.substr(3,2),16);
        var b = parseInt(hexcolor.substr(5,2),16);
        return (r*0.299)+(g*.587)+(b*0.114);
      } else {
        return 255;
      }
    };
    var contrast = function(hexcolor){
      var luma = yiq(hexcolor);
      if (luma < 32) return "#CCCCCC";
      else if (luma < 128) return "#FFFFFF";
      else if (luma < 224) return "#000000";
      else return "#333333";
    };
    var walkPico =
      function(pico,dNumber,dLeft,dTop){
        pico.dname = getV(pico,"dname",dNumber?"Child "+dNumber:"Root Pico");
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
          +"background-color:"+color+";"
          +"color:"+contrast(color));
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
        var subscriptions = get(db_dump.pico,[pico.id,"io.picolabs.subscription","vars","subscriptions"]);
        if (subscriptions) {
          for ( var k in subscriptions ) {
            var subs_status = get(subscriptions,[k,"attributes","status"]);
            var subs_eci = get(subscriptions,[k,"attributes","subscriber_eci"]);
            if (subs_status && subs_status==="subscribed" && subs_eci) {
              var subs_id = get(db_dump.channel,[subs_eci,"pico_id"]);
              if (subs_id) {
                db_graph.chans.push({ class: pico.id +"-origin "+ subs_id +"-target subscription" });
              }
            }
          }
        }
      };
    walkPico(ownerPico,0,"300","50");
    renderGraph(db_graph,authenticated);
    $.getJSON("/api/engine-version",function(data){
      $("#version").text(data ? data.version : "undefined");
    });
    $("#user-logout a").click(function(e){
      e.preventDefault();
      sessionStorage.removeItem("owner_pico_id");
      sessionStorage.removeItem("owner_pico_eci");
      location.reload();
    });
  }
  var logged_in_pico = { "id": sessionStorage.getItem("owner_pico_id"),
    "eci": sessionStorage.getItem("owner_pico_eci")};
  var noLoginRequired = function(){
    sessionStorage.removeItem("owner_pico_id");
    sessionStorage.removeItem("owner_pico_eci");
    do_main_page(rootPico);
  };
  if (renderDemo) {
    $.getJSON( json_name + ".json", renderGraph);
    $.getJSON("/api/engine-version",function(data){
      $("#version").text(data ? data.version : "undefined");
    });
  } else if (logged_in_pico.id) {
    do_main_page(logged_in_pico,true);
  } else {
    if (typeof handlePicoLogin === "function") {
      $.post("/sky/event/"+rootPico.eci+"/none/owner/eci_requested",function(d){
        if(d && d.directives && d.directives[0] && d.directives[0].options){
          handlePicoLogin(
            d.directives[0].options,
            formToJSON,
            function(authenticatedPico){
              do_main_page(authenticatedPico,true);
            });
        } else {
          noLoginRequired();
        }
      }).fail(noLoginRequired);
    } else {
      noLoginRequired();
    }
  }
});
});
