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
                callback(c.id);
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
            callback();
          } else {
            log("*Problem registering "+rid);
          }
        });
      } else {
        log("*Problem getting "+rid);
      }
    },"text");
  };
  log("Loading database");
  $.getJSON("/api/db-dump", function(db_dump){
    log("Database loaded");
    if (db_dump.pico) {
      log("Database has an owner Pico");
      if (db_dump.rulesets) {
        log("Database has rulesets");
      } else {
        log("*Problem");
      }
    } else {
      log("Creating owner Pico");
      createOwnerPico(function(eci){
        log("Registering rulesets");
        installRuleset("io.picolabs.pico",function(){
          installRuleset("io.picolabs.visual_params",function(){
          });
        });
      });
    }
  });
});
