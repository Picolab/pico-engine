$(document).ready(function() {
  var json_name = location.search.substring(1);
  if (json_name.length === 0) json_name = "genvis";
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
$.getJSON("/api/db-dump", function(db_dump){
  var dragstop = function(event,ui) {
    var nodeId = ui.helper[0].getAttribute("id");
    $('#'+nodeId).next(".pico-edit").css('left',ui.position.left)
                                    .css('top',ui.position.top);
    if(json_name !== "genvis") return; // no one to notify for demos
    $.getJSON(
      "/sky/event/"+findEciById(nodeId)+"/23/visual/moved",
      { left: ui.position.left, top: ui.position.top });
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
      if (thePicoInp["io.picolabs.pico"]) {
        if (thePicoInp["io.picolabs.pico"].vars) {
          if (thePicoInp["io.picolabs.pico"].vars.parent) {
            thePicoOut.parent = thePicoInp["io.picolabs.pico"].vars.parent;
          }
          if (thePicoInp["io.picolabs.pico"].vars.children) {
            thePicoOut.children = thePicoInp["io.picolabs.pico"].vars.children;
          }
        }
      }
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
      for (var rid in db_dump.rulesets.enabled) {
        if (installedRS[rid] === undefined) {
          avail.push(rid);
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
  var krlSrcInvite = "//click on a ruleset name to see its source here";
  var displayKrl = function() {
    $(this).siblings(".krl-showing").toggleClass("krl-showing");
    var src = "N/A";
    if($(this).hasClass("krl-showing")) {
      src = krlSrcInvite;
    } else {
      var rs_info = db_dump.rulesets.enabled[$(this).html()];
      if (rs_info) { src = db_dump.rulesets.krl[rs_info.hash].src; }
    }
    $(this).parent().parent().parent().find(".krlsrc textarea").html(src);
    $(this).toggleClass("krl-showing");
  }
  var renderTab =
    function(){
      $(this).parent().find('.active').toggleClass('active');
      $(this).toggleClass('active');
      if(json_name !== "genvis") return; // nothing to render for demos
      var liContent = $(this).html().toLowerCase();
      var tabTemplate = Handlebars.compile($('#'+liContent+'-template').html());
      var $theSection = $(this).parent().next('.pico-section');
      $theSection.html(tabTemplate(specDB($(this))));
      if(liContent === "rulesets") {
        $(".pico-edit .krlrid").click(displayKrl);
        $(".krlsrc textarea").html(krlSrcInvite);
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
  $.getJSON(
     json_name + ".json",
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
                                 };
                  $pediv.fadeIn();
                  $pediv.animate(fadeInOptions,
                                 function(){
                                   $pediv.prepend("<button class=\"x\">X</button>");
                                   $pediv.find('button.x').click(fadeAway);
                                 });
                })
         .each(function(){updateEdges($(this).attr("id"))})
         .parent().find('ul li').click(renderTab);
     }
  );
});
});
