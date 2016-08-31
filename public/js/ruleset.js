$(document).ready(function() {
  var get = // adapted from lodash.get, with thanks
    function(o,p,v) {
      var i=0, l=p.length;
      while(o && i<l) { o = o[p[i++]]; }
      return o ? o : v;
    }
  var mpl = Handlebars.compile($('#the-template').html());
$.getJSON("/api/db-dump", function(db_dump){
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
  var renderContent =
    function(){
      var contentTemplate = Handlebars.compile($('#rulesets-template').html());
      $('#rulesets').html(contentTemplate(db_dump.rulesets));
      $(".krlrid").click(displayKrl);
      $(".krlsrc textarea").html(krlSrcInvite);
      $(".lined").linedtextarea();
    };
  var renderGraph =
     function(data){
       $('body').html(mpl(data));
       document.title = $('body h1').html();
     };
  var rs_graph = {};
  rs_graph.title = "Engine Rulesets";
  rs_graph.descr = "These are the rulesets managed by this KRE";
  renderGraph(rs_graph);
  renderContent();
});
});
