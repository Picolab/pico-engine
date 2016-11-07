$(document).ready(function() {
  var student_id = $("#student_id").val();
  var section_id = $("#section_id").val();
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
  var getAnonECI = function(name,eci,event,attrs,callback) {
    log("Getting "+name+" pico anonymous eci");
    $.getJSON(
        "/sky/event/"+eci+"/get_anon_eci/"+event+"?"+attrs,
        function(data){
      var new_eci;
      var dl = data.directives.length;
      for(var i=0; i<dl; ++i) {
        var dd = data.directives[i];
        if (dd.name === name) {
          new_eci = get(dd,["options","eci"],undefined);
          break;
        }
      }
      if (new_eci) {
        callback(new_eci);
      } else {
        log("*Problem: could not obtain anonymous eci");
        log("Directives received: "+dl);
        log(JSON.stringify(data,undefined,2));
      }
    });
  }
  log("Finding owner pico");
  $.getJSON("/api/owner-channel", function(owner){
    if (owner.channel) {
      var ownerPico = {};
      for (var k in owner.channel) { ownerPico.eci = k; break; }
      ownerPico.id = get(owner.channel,[ownerPico.eci,"pico_id"]);
      log("Owner pico id is "+ownerPico.id);
      $("#own_eci").val(ownerPico.eci);
      log("Finding registration pico");
      if (student_id) {
        log("Recognize student_id "+student_id);
        getAnonECI("registration",ownerPico.eci,"registration/channel_needed","student_id="+student_id,function(reg_eci){
          log("Registration pico anonymous eci is "+reg_eci);
          $("#reg_eci").val(reg_eci);
          if (section_id) {
            log("Recognize section_id "+section_id);
            getAnonECI("section_collection",reg_eci,"section/needed","student_id="+student_id+"&section_id="+section_id,function(sc_eci){
              log("Section collection pico anonymous eci is "+sc_eci);
              $("#sco_eci").val(sc_eci);
              getAnonECI("section_ready",sc_eci,"section/needed","student_id="+student_id+"&section_id="+section_id,function(sr_eci){
                log("Section pico anonymous eci is "+sr_eci);
                $("#sec_eci").val(sr_eci);
                $.getJSON("/sky/cloud/"+sr_eci+"/app_section/sectionInfo",function(sinfo) {
                  if (sinfo.capacity) {
                    $.getJSON("sky/event/"+sr_eci+"/join_section/section/add_request?student_id="+student_id,function(the_resp){
                      log(JSON.stringify(the_resp,undefined,2));
                    });
                  } else {
                    log("*Problem: section not configured");
                  }
                });
              });
            });
          } else {
            log("*Problem: missing section id");
          }
        });
      } else {
        log("*Problem: missing Net ID");
      }
    } else {
      log("*Problem: no owner pico");
    }
  });
});
