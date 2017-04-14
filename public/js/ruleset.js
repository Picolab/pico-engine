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
    if (db_dump.rulesets) {
      for (var vds in db_dump.rulesets.versions[rid]) {
        hashobj = db_dump.rulesets.versions[rid][vds];
      }
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
    $(this).parent().siblings(".krl-showing").toggleClass("krl-showing");
    if($(this).parent().hasClass("krl-showing")) {
      $(".krlsrc textarea").html(krlSrcInvite);
    } else {
      var rid = $(this).html();
      var src = srcFromEnabled(rid);
      if (src) {
        $(this).parent().removeClass("disabled");
      } else {
        $(this).parent().addClass("disabled");
        src = srcFromVersions(rid,"N/A");
      }
      if (location.hash.substring(1) === rid) {
        $(".krlsrc textarea").html(src);
      } else {
        location.hash = rid;
        location.reload();
      }
    }
    $(this).parent().toggleClass("krl-showing");
    $("pre#feedback").html("");
  }
  var renderContent =
    function(data){
      var mpl = Handlebars.compile($('#the-template').html());
      $('body').html(mpl(data));
      document.title = $('body h1').html();
      $(".krlrid span").click(displayKrl);
      $(".krlsrc input").val(rid);
      $(".lined").linedtextarea();
      if(rid){
        $(".krlrid").filter(function(){
          return $(this).find('span').text() === rid;
        }).toggleClass("krl-showing");
      }
    };
  var rs_data = {};
  rs_data.title = "Engine Rulesets";
  rs_data.descr = "These rulesets are hosted on this pico engine.";
  if(rid){
    rs_data.src = srcFromVersions(rid,krlSrcInvite);
  } else {
    rs_data.src = krlSrcInvite;
  }
  rs_data.rulesets = {};
  if (db_dump.rulesets && db_dump.rulesets.versions) {
    for(var aRid in db_dump.rulesets.versions) {
      rs_data.rulesets[aRid] = {};
      rs_info = get(db_dump.rulesets,["enabled",aRid],undefined);
      if (rs_info) {
        rs_data.rulesets[aRid].enabled = true;
        if (get(db_dump.rulesets,["krl",rs_info.hash,"url"],undefined)) {
          rs_data.rulesets[aRid].hasURL = true;
        }
        if (aRid !== "io.picolabs.pico" && aRid !== "io.picolabs.visual_params") {
          rs_data.rulesets[aRid].canDel = true;
        }
      }
    }
  }
  var ridRE = /^[a-zA-Z][a-zA-Z0-9_.-]*$/;
  rs_data.ridRE = ridRE.toString();
  renderContent(rs_data);
  $("form.ruleset-new").submit(function(e){
    e.preventDefault();
    var rid = this.rid.value;
    if (ridRE.test(rid)) {
      if (get(db_dump,["rulesets","versions",rid],undefined)) {
        location.hash = rid;
        location.reload();
      } else {
        $("pre#feedback").html("Registering...");
        var src = "ruleset "+rid+" {\n"
          + "  meta {\n"
          + "    shares __testing\n"
          + "  }\n"
          + "  global {\n"
          + "    __testing = { \"queries\": [ { \"name\": \"__testing\" } ],\n"
          + "                  \"events\": [ ] }\n"
          + "  }\n"
          + "}\n";
        picoAPI("/api/ruleset/register",{"src":src},"POST",function(err, result){
          if(err){
            alert("Error: " + err);
            return;
          }
          location.hash = rid;
          location.reload();
        });
      }
    } else {
      alert("invalid ruleset id");
    }
  });
  $(".flush").click(function(e){
    e.preventDefault();
    picoAPI($(this).attr("href"),undefined,"GET",function(err, data){
      if(err){
        $("pre#feedback").html("<span style=\"color:red\">" + err + "</span>");
        return;
      }
      location.hash = data.rid;
      location.reload();
    });
  });
  $(".unregister").click(function(e){
    e.preventDefault();
    picoAPI($(this).attr("href"),undefined,"GET",function(err, data){
      if(err){
        $("pre#feedback").html("<span style=\"color:red\">" + err + "</span>");
        return;
      }
      location.hash = "";
      location.reload();
    });
  });
  $("form.registerFromURL").submit(function(e){
    e.preventDefault();
    var url = this.url.value;
    picoAPI("/api/ruleset/register",{"url":url},"GET",function(err, data){
      if(err){
        $("pre#feedback").html("<span style=\"color:red\">Problem registering "
                + url + "\n" + err + "</span>");
        return;
      }
      location.hash = data.rid;
      location.reload();
    });
  });
  $("div.krlsrc form button").click(function(){
    $(this).siblings(".clicked").toggleClass("clicked")
    $(this).toggleClass("clicked");
  });
  $("div.krlsrc").on("submit","form.ruleset-action",function(e){
    e.preventDefault();
    var formAction = $(".clicked").text();
    $(".clicked").toggleClass("clicked");
    var $feedback = $("pre#feedback");
    $feedback.html("working...");
    var src = this.src.value;
    picoAPI("/api/ruleset/compile",{"src":src},"POST",function(err, data){
      if(err){
        $feedback.html("<span style=\"color:red\">" + err + "</span>");
        return;
      }
      if (formAction === "validate") {
        $feedback.html("ok");
        return;
      }
      var rid = data.code.split(/"/)[3];
      picoAPI("/api/ruleset/register",{"src":src},"POST",function(err){
        if(err){
          $feedback.html("<span style=\"color:red\">Problem registering "
                  + rid + "\n" + err + "</span>");
          return;
        }
        location.reload();
      });
    });
  });
});
});
