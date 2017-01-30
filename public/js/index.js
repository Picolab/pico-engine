$(document).ready(function() {
  var $pre = $('#operations pre');
  var log = function(m) {
    $pre.append(m).append("\r\n");
  }
  var logProblem = function(m) {
    log("*Problem "+m);
    $("#review").addClass("problem");
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
                callback(d.id,c.id);
              } else {
                logProblem("creating owner pico channel");
              }
            }
        );
      } else {
        logProblem("creating owner pico");
      }
    });
  };
  var hashForRid = function(rid,callback){
    log("Getting hash for "+rid);
    $.getJSON("/api/db-dump", function(db_dump){
      var hashobj;
      for (var vds in db_dump.rulesets.versions[rid]) {
        hashobj = db_dump.rulesets.versions[rid][vds];
      }
      if (hashobj) {
        for(var hash in hashobj)
        {
          log(rid+" hash is "+hash);
          callback(hash);
          return;
        }
      }
      logProblem("getting hash for "+rid);
    });
  };
  var installAndAddRuleset = function(rid,id,callback){
    log("Getting "+rid+".krl");
    $.get("https://raw.githubusercontent.com/Picolab/node-pico-engine/master/krl/"+rid+".krl",function(k){
      if (k && k.length > 0) {
        log(rid+".krl length: "+k.length);
        log("Registering "+rid);
        $.getJSON("/api/ruleset/register",{"src":k},function(rr){
          if (rr && rr.ok) {
            log(rid+" registered");
            hashForRid(rid,function(hash){
              log("Enabling "+rid);
              $.getJSON("/api/ruleset/enable/"+hash,function(re){
                if (re && re.ok) {
                  log(rid+" enabled");
                  log("Installing "+rid);
                  $.getJSON("/api/ruleset/install/"+rid,function(ri){
                    if (ri && ri.ok) {
                      log(rid+" installed");
                      log("Adding "+rid+" to pico "+id);
                      $.getJSON("/api/pico/"+id+"/add-ruleset?rid="+rid,function(ra){
                        if (ra && ra.ok) {
                          log(rid+" added to pico "+id);
                          callback();
                        } else {
                          logProblem("adding "+rid);
                        }
                      });
                    } else {
                      logProblem("installing "+rid);
                    }
                  }).fail(function() {
                    logProblem("installing "+rid+": failed to compile");
                  });
                } else {
                  logProblem("enabling "+rid);
                }
              });
            });
          } else {
            logProblem("registering "+rid);
          }
        });
      } else {
        logProblem("getting "+rid);
      }
    },"text");
  };
  log("Loading database");
  $.getJSON("/api/db-dump", function(db_dump){
    log("Database loaded");
    if (db_dump.pico) {
      log("Database has an owner pico");
      if (db_dump.rulesets) {
        log("Database has rulesets");
        $("#done").addClass("okay");
      } else {
        logProblem("finding rulesets");
      }
    } else {
      log("Creating owner pico");
      createOwnerPico(function(id,eci){
        log("Registering rulesets");
        installAndAddRuleset("io.picolabs.pico",id,function(){
          log("Sending event pico/root_created");
          $.getJSON("/sky/event/"+eci+"/19/pico/root_created",
            {"id":id,"eci":eci},function(d){
              if (d && d.directives) {
                log("Event pico/root_created processed");
              } else {
                logProblem("with event pico/root_created");
              }
          });
          installAndAddRuleset("io.picolabs.visual_params",id,function(){
            log("Sending event visual/update");
            $.getJSON("/sky/event/"+eci+"/31/visual/update",
              {"dname":"Owner Pico","color":"#87cefa"},function(d){
                if (d && d.directives) {
                  log("Event visual/update processed");
                  $("#done").addClass("okay");
                } else {
                  logProblem("with event visual/update");
                }
            });
          });
        });
      });
    }
  });
});
