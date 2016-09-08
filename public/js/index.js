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
$.getJSON("/api/db-dump", function(db_dump){
  log("Database loaded");
  if (!db_dump.pico) {
    log("Creating owner Pico");
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
  } else {
    log("Database has an owner Pico");
  }
  if (!db_dump.rulesets) {
    log("Registering rulesets");
    log("Getting io.picolabs.pico.krl");
    $.get("https://raw.githubusercontent.com/Picolab/node-pico-engine/master/krl/io.picolabs.pico.krl",function(k){
      if (k && k.length > 0) {
        log("io.picolabs.pico.krl length: "+k.length);
        log("Registering io.picolabs.pico");
        $.getJSON("/api/ruleset/register",{"src":k},function(r){
          if (r && r.ok) {
            log("io.picolabs.pico registered");
          } else {
            log("*Problem registering io.picolabs.pico");
          }
        });
      } else {
        log("*Problem getting io.picolabs.pico.krl");
      }
    },"text");
    log("Getting io.picolabs.visual_params.krl");
    $.get("https://raw.githubusercontent.com/Picolab/node-pico-engine/master/krl/io.picolabs.visual_params.krl",function(k){
      if (k && k.length > 0) {
        log("io.picolabs.visual_params.krl length: "+k.length);
        log("Registering io.picolabs.visual_params");
        $.getJSON("/api/ruleset/register",{"src":k},function(r){
          if (r && r.ok) {
            log("io.picolabs.visual_params registered");
          } else {
            log("*Problem registering io.picolabs.visual_params");
          }
        });
      } else {
        log("*Problem getting io.picolabs.visual_params.krl");
      }
    },"text");
  } else {
    log("Database has rulesets");
  }
});
});
