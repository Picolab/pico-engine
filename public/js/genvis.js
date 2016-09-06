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
$.getJSON("/api/db-dump", function(db_dump){
  var dragstop = function(event,ui) {
    var nodeId = ui.helper[0].getAttribute("id");
    $('#'+nodeId).next(".pico-edit").css('left',ui.position.left)
                                    .css('top',ui.position.top);
    if(!renderDemo) {
      $.getJSON(
        "/sky/event/"+findEciById(nodeId)+"/23/visual/moved",
        { left: ui.position.left, top: ui.position.top });
    }
  }
  var fadeInOptions = {
    width: "95%",
    height: "85%",
    top: 0,
    left: 0 };
  var fadeOutOptions;
  var specDB = function($li) { //specialize the db for the particular tab
    var label = $li.html();
    var thePicoInp = db_dump.pico[$li.parent().parent().prev().attr("id")];
    if (label === "About") {
      var thePicoOut = {};
      thePicoOut.id = thePicoInp.id;
      for (var channel in thePicoInp.channel) {
        thePicoOut.eci = channel;
        break;
      }
      thePicoOut.parent = get(thePicoInp,["io.picolabs.pico","vars","parent"],undefined);
      if (!thePicoOut.parent) thePicoOut.root = true;
      thePicoOut.children = get(thePicoInp,["io.picolabs.pico","vars","children"],[]);
      var i = 0;
      var cLen = thePicoOut.children.length;
      for (; i<cLen; ++i) {
        var p = thePicoOut.children[i];
        p.canDel = get(db_dump.pico,
                       [p.id,"io.picolabs.pico","vars","children"],
                       []).length == 0; 
      }
      thePicoOut.dname = getV(thePicoInp,"dname",
                              $li.parent().parent().prev().text());
      thePicoOut.color = getV(thePicoInp,"color",
                              thePicoOut.parent?"#7FFFD4":"#87CEFA");
      return thePicoOut;
    } else if (label === "Rulesets") {
      var theRulesetInp = thePicoInp;
      var installedRS = {};
      for (var rs in theRulesetInp.ruleset) {
        installedRS[rs] = theRulesetInp.ruleset[rs];
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
        "installed": installedRS,
        "avail" : avail };
      return theRulesetOut;
    } else if (label === "Channels") {
      return thePicoInp;
    } else {
      return db_dump;
    }
  }
  var displayKrl = function() {
    window.open("/ruleset.html#"+$(this).html(),"ruleset");
  }
  var renderTab =
    function(){
      $(this).parent().find('.active').toggleClass('active');
      $(this).toggleClass('active');
      if(renderDemo) return; // nothing to render for demos
      var liContent = $(this).html().toLowerCase();
      var tabTemplate = Handlebars.compile($('#'+liContent+'-template').html());
      var $theSection = $(this).parent().next('.pico-section');
      var theDB = specDB($(this));
      $theSection.html(tabTemplate(theDB));
      if(liContent === "rulesets") {
        $(".pico-edit .krlrid").click(displayKrl);
        var d = theDB.pico_id+"-Rulesets";
        $theSection.find('.js-ajax-form').submit(function(e){
            e.preventDefault();
            $.getJSON($(this).attr("action"),formToJSON(this),function(){
                if (location.hash !== d) {
                  location.hash = d;
                }
                location.reload();
            });
        });
      } else if(liContent === "about") {
        $theSection.find('.use-minicolors').minicolors(
          { swatches: "#ccc|#fcc|#7fffd4|#ccf|#ffc|#87CEFA|#fcf".split('|')});
        $('.minicolors-input-swatch').css('top',0);
        $('.minicolors-input-swatch').css('left',0);
        var d = theDB.id+"-About";
        $theSection.find('.js-ajax-link').click(function(e){
            e.preventDefault();
            $.getJSON($(this).attr("href"),{},function(){
                if (location.hash !== d) {
                  location.hash = d;
                }
                location.reload();
              });
          });
        $theSection.find('.js-ajax-form').submit(function(e){
            e.preventDefault();
            $.getJSON($(this).attr("action"),formToJSON(this),function(){
                if (location.hash !== d) {
                  location.hash = d;
                }
                location.reload();
            });
        });
      } else if(liContent === "channels") {
        var d = theDB.id+"-Channels";
        $theSection.find('.js-ajax-form').submit(function(e){
            e.preventDefault();
            $.getJSON($(this).attr("action"),formToJSON(this),function(){
                if (location.hash !== d) {
                  location.hash = d;
                }
                location.reload();
            });
        });
      }
    };
  var mpl = Handlebars.compile($('#the-template').html());
  var findEciById = function(id) {
    var thePicoInp = db_dump.pico[id];
    for (var channel in thePicoInp.channel) {
      return channel;
    }
    return id;
  }
  var renderGraph =
     function(data){
       $('body').html(mpl(data));
       document.title = $('body h1').html();
       $('div.pico')
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
                                   $pediv.prepend("<button class=\"x\">X</button>");
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
    var getV = function(p,n,d) {
      return get(db_dump.pico,[p.id,"io.picolabs.visual_params","vars",n],d);
    }
    var db_graph = {};
    var ownerPico = {};
    for (var k in db_dump.pico) { ownerPico.id = k; break; }
    db_graph.title = getV(ownerPico,"title","My Picos");
    db_graph.descr = getV(ownerPico,"descr", "These are my Picos hosted by this KRE.");
    db_graph.picos = [];
    db_graph.chans = [];
    var walkPico =
      function(pico,dNumber,dLeft,dTop){
        pico.dname = getV(pico,"dname",dNumber?"Child "+dNumber:"Owner Pico");
        var width = getV(pico,"width",undefined);
        var left = getV(pico,"left",dLeft);
        var top = getV(pico,"top",dTop);
        var color = getV(pico,"color",dNumber?"aquamarine":"lightskyblue");
        pico.style = getV(pico,"style",
          (width?"width:"+width+"px;":"")
          +"left:"+left+"px;"
          +"top:"+top+"px;"
          +"background-color:"+color);
        db_graph.picos.push(pico);
        var children = get(db_dump.pico,[pico.id,"io.picolabs.pico","vars","children"],[]);
        var i=0, l=children.length;
        for (;i<l;++i) {
          var cp = { id: children[i].id };
          db_graph.chans.push({ class: pico.id +"-origin "+ cp.id +"-target" });
          walkPico(cp,dNumber*10+i+1,left+(i*10)+20,top+20);
        }
      }
    walkPico(ownerPico,0,300,50);
    renderGraph(db_graph);
  }
});
});
