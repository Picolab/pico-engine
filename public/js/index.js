$(document).ready(function() {
  var $pre = $('pre');
  var log = function(m) {
    $pre.append(m).append("\r\n");
  }
  var get = // adapted from lodash.get, with thanks
    function(o,p,v) {
      var i=0, l=p.length;
      while(o && i<l) { o = o[p[i++]]; }
      return o ? o : v;
    }
  log("Loading database");
  var createOwnerPico = function(callback){
    $.getJSON("/api/new-pico", function(d) {
      if (d && d.id) {
        log("Pico created: "+d.id);
        log("Creating owner channel");
        $.getJSON("/api/pico/"+d.id+"/new-channel",
            {"name": "main", "type": "secret"},
            function(c){
              if (c && c.id) {
                log("Owner Pico ECI: "+c.id);
              } else {
                log("*Problem creating owner Pico channel");
              }
            }
        );
      } else {
        log("*Problem creating owner Pico");
      }
    });
  };
  var installRuleset = function(rid,callback){
    log("Getting "+rid);
    $.get("https://raw.githubusercontent.com/Picolab/node-pico-engine/master/krl/"+rid+".krl",function(k){
      if (k && k.length > 0) {
        log(rid+".krl length: "+k.length);
        log("Registering "+rid);
        $.getJSON("/api/ruleset/register",{"src":k},function(r){
          if (r && r.ok) {
            log(rid+" registered");
          } else {
            log("*Problem registering "+rid);
          }
        });
      } else {
        log("*Problem getting "+rid);
      }
    },"text");
  };
$.getJSON("/api/db-dump", function(db_dump){
  log("Database loaded");
  if (!db_dump.pico) {
    log("Creating owner Pico");
    createOwnerPico();
  } else {
    log("Database has an owner Pico");
  }
  if (!db_dump.rulesets) {
    log("Registering rulesets");
    installRuleset("io.picolabs.pico");
    installRuleset("io.picolabs.visual_params");
  } else {
    log("Database has rulesets");
  }
});
});
