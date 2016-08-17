$(document).ready(function() {
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
  var dragstop = function(event,ui) {
    var nodeId = ui.helper[0].getAttribute("id");
    $('#'+nodeId).next(".pico-edit").css('left',ui.position.left)
                                    .css('top',ui.position.top);
  }
  var fadeInOptions = {
    width: "95%",
    height: "85%",
    top: 0,
    left: 0 };
  var fadeOutOptions;
  var db_dump;
  var specDB = function($li) {
    var label = $li.html();
    var thePicoInp = db_dump.pico[$li.parent().parent().prev().attr("id")];
    if (label === "About") {
      return thePicoInp;
    } else if (label === "Rulesets") {
      var theRulesetInp = thePicoInp;
      var theRulesetOut = {};
      for (var rs in theRulesetInp.ruleset) {
        theRulesetOut[rs] = theRulesetInp.ruleset[rs];
        if (theRulesetInp[rs]) {
          theRulesetOut[rs].vars = theRulesetInp[rs].vars;
        }
      }
      return theRulesetOut;
    } else {
      return db_dump;
    }
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
    };
  var mpl = Handlebars.compile($('#the-template').html());
  var json_name = location.search.substring(1);
  if (json_name.length === 0) json_name = "genvis";
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
                                   $pediv.find('button').remove();
                                   $pediv.animate(fadeOutOptions);
                                   $pediv.fadeOut();
                                   ev.stopPropagation();
                                 };
                  $pediv.fadeIn();
                  $pediv.animate(fadeInOptions,
                                 function(){
                                   $pediv.prepend("<button>X</button>");
                                   $pediv.find('button').click(fadeAway);
                                 });
                })
         .each(function(){updateEdges($(this).attr("id"))})
         .parent().find('ul li').click(renderTab);
     }
  );
  if (json_name === "genvis") {
    $.getJSON("/api/db-dump", function(data){ db_dump = data; });
  }
});
