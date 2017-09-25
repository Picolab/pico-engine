$(document).ready(function() {
  $("#section_id").load("http://sanbachs.net/byu/picolabs/cgi-bin/sec-sel.cgi");
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
  var findOwnerPico = function(callback) {
    var own_eci = $("#own_eci").val();
    if (own_eci){
      callback(own_eci);
    } else {
      log("Finding owner pico");
      $.getJSON("/api/owner-eci", function(owner){
        if (owner.ok && owner.eci) {
          own_eci = owner.eci;
          $("#own_eci").val(own_eci);
          callback(own_eci);
        } else {
          log("*Problem: no owner pico");
        }
      });
    }
  }
  var getRegistrationPico = function(student_id,callback) {
    var reg_eci = $("#reg_eci").val();
    if (reg_eci) {
      callback(reg_eci);
    } else {
      log("Finding registration pico");
      if (student_id) {
        log("Recognize student_id "+student_id);
        var own_eci = $("#own_eci").val();
        getAnonECI("registration",own_eci,"registration/channel_needed","student_id="+student_id,function(the_eci){
          log("Registration pico anonymous eci is "+the_eci);
          $("#reg_eci").val(the_eci);
          callback(the_eci);
        });
      } else {
        log("*Problem: missing Student");
      }
    }
  }
  var doAll = function() {
    var student_id = $("#student_id").val();
    var section_id = $("#section_id").val();
    $pre.empty();
    findOwnerPico(function(own_eci){
      getRegistrationPico(student_id,function(reg_eci){
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
                      if (the_resp.directives) {
                        for(var i=0;i<the_resp.directives.length;++i){
                          if (the_resp.directives[i].name == "request_granted"){
                            var drop_url = "/sky/event/"
                              + sr_eci
                              + "/click-to-drop/"
                              + "section/drop_request?student_id="
                              + student_id;
                            $("#enrolled_sections").append(
                              $("<li>").append(section_id).append(
                                $("<a>").attr('href',drop_url).append(" drop")
                              ));
                          }
                        }
                      }
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
    });
  }
  doAll();
  $("#student_id").on("change",function(){
    $("#reg_eci").val("");
    $("#section_id").val("");
    $("#sco_eci").val("");
    $("#sec_eci").val("");
    $("#enrolled_sections").empty();
    doAll();
  });
  $("#section_id_btn").on("click",function(){
    $("#sco_eci").val("");
    $("#sec_eci").val("");
    doAll();
  });
  $("#enrolled_sections").on("click","li a",function(ev){
    ev.preventDefault();
    var the_url = $(this).attr("href");
    $.getJSON(the_url,function(rep){
      $pre.empty();
      log(JSON.stringify(rep,undefined,2));
    });
    $(this).parent().remove();
  });
});
