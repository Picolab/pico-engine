$(document).ready(function() {
  var rid = location.hash.substring(1);
  var get = // adapted from lodash.get, with thanks
    function(o,p,v) {
      var i=0, l=p.length;
      while(o && i<l) { o = o[p[i++]]; }
      return o ? o : v;
    }
  var formToJSON = function(form){
    var json = {};
    $.each($(form).serializeArray(), function(key, elm){
      json[elm.name] = elm.value;
    });
    return json;
  };
$.getJSON("/api/db-dump", function(db_dump){
  var srcFromEnabled = function(rid) {
    var rs_info = get(db_dump.rulesets,["enabled",rid],undefined);
    if (rs_info) {
      return get(db_dump.rulesets,["krl",rs_info.hash,"src"],undefined);
    } else {
      return undefined;
    }
  }
  var srcFromVersions = function(rid,ifnone) {
    var hashobj;
    for (var vds in db_dump.rulesets.versions[rid]) {
      hashobj = db_dump.rulesets.versions[rid][vds];
    }
    if (hashobj) {
      for(var hash in hashobj)
      {
        return db_dump.rulesets.krl[hash].src;
      }
    }
    return ifnone;
  }
  var krlSrcInvite = "//click on a ruleset name to see its source here";
  var displayKrl = function() {
    $(this).siblings(".krl-showing").toggleClass("krl-showing");
    if($(this).hasClass("krl-showing")) {
      src = krlSrcInvite;
    } else {
      var rid = $(this).html();
      src = srcFromEnabled(rid);
      if (src) {
        $(this).removeClass("disabled");
      } else {
        $(this).addClass("disabled");
        src = srcFromVersions(rid,"N/A");
      }
    }
    $(".krlsrc textarea").html(src);
    $(this).toggleClass("krl-showing");
    $("pre#feedback").html("");
  }
  var renderContent =
    function(data){
      var mpl = Handlebars.compile($('#the-template').html());
      $('body').html(mpl(data));
      document.title = $('body h1').html();
      $(".krlrid").click(displayKrl);
      $(".krlsrc input").val(rid);
      $(".krlsrc textarea").html(krlSrcInvite);
      $(".lined").linedtextarea();
      if(rid){
        $(".krlrid:contains('"+rid+"')").trigger("click");
      }
    };
  var rs_data = {};
  rs_data.title = "Engine Rulesets";
  rs_data.descr = "These are the rulesets hosted by this KRE.";
  rs_data.rulesets = {};
  for(var aRid in db_dump.rulesets.versions) {
    rs_data.rulesets[aRid] = {};
    if (get(db_dump.rulesets,["enabled",aRid],undefined)) {
      rs_data.rulesets[aRid].enabled = true;
    }
  }
  renderContent(rs_data);
  $("form.ruleset-new").submit(function(e){
    e.preventDefault();
    var rid = this.rid.value;
    $(".krlsrc input").val(rid);
    $(".krlsrc textarea").html("ruleset "+rid+" {\n}");
  });
  $("div.krlsrc form button").click(function(){
    $(this).siblings(".clicked").toggleClass("clicked")
    $(this).toggleClass("clicked");
  });
  $("div.krlsrc").on("submit","form.ruleset-compile",function(e){
    e.preventDefault();
    var $feedback = $("pre#feedback");
    $feedback.html("Compiling...");
    var formAction = "/api/ruleset/compile";
    if ($(".clicked").attr("id") === "btn-register") {
      $feedback.html("Registering...");
      formAction = "/api/ruleset/register";
    }
    $.getJSON(formAction,formToJSON(this),function(result){
      if(result.error){
        $feedback.html(result.error);
      } else if(result.code || result.ok){
        $feedback.html("ok");
      } else {
        $feedback.html(JSON.stringify(result));
      }
    });
  });
});
});
