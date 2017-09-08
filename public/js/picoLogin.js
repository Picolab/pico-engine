  var handlePicoLogin = function(rootPico,users,formToJSON,callback){
    var getCookie = function(name) {
      var value = "; " + document.cookie;
      var parts = value.split("; " + name + "=");
      if (parts.length == 2) return parts.pop().split(";").shift();
    }
    var performLogin = function(options,delay){
      sessionStorage.setItem("owner_pico_id",options.pico_id);
      sessionStorage.setItem("owner_pico_eci",options.eci);
      var redirect = getCookie("previousUrl") || "/";
      //should clear cookie here! ?maybe
      if(!delay){
        location.assign(redirect);
      }
    }
    var loginTemplate = Handlebars.compile($('#login-template').html());
    var ownerTemplate = Handlebars.compile($('#owner-id-template').html());
    var newAccountTemplate = Handlebars.compile($("#new-account-template").html());
    var codeWordsTemplate = Handlebars.compile($("#code-words-template").html());
    var loginData = {
      "root_pico_id":rootPico.id,
      "users":users,
      "missingAcctMgmtRuleset":true
    };
    $('body').html(loginTemplate(loginData));
    document.title = $('body h1').html();
    var $lds = $("#login-display-switch");
    var missingAcctMgmtRuleset = function() {
      $lds.html("Root Pico does not have an account management ruleset");
    };
    $.post("/sky/event/"+rootPico.eci+"/none/owner/eci_requested",function(d){
      if(d && d.directives && d.directives[0]){ // okay
      } else {
        missingAcctMgmtRuleset();
      }
    }).fail(missingAcctMgmtRuleset);
    $lds.html(ownerTemplate({}));
    $("input")[0].focus();
    $("#user-login").click(function(){
      var ownerPico_id = $("#user-select").val();
      var logged_in_pico = {id:ownerPico_id};
      sessionStorage.setItem("owner_pico_id",ownerPico_id);
      if (ownerPico_id) {
        callback(logged_in_pico);
      } else {
        callback(rootPico);
      }
    });
    $lds.on("click",'#need-account',function(e){
      e.preventDefault();
      $("#need-account").toggle();
      $lds.slideToggle(400,function(){
        $lds.html(newAccountTemplate({}));
        $lds.slideToggle(400,function(){
          $("input")[0].focus();
        });
      });
    });
    $lds.on("click","#already-account",function(e){
      e.preventDefault();
      $("#already-account").toggle();
      $lds.slideToggle(400,function(){
        $lds.html(ownerTemplate({}));
        $lds.slideToggle(400,function(){
          $("input")[0].focus();
        });
      });
    });
    $lds.on("change","#method",function(e){
      e.preventDefault();
      if($(this).val() !== "password") {
        $(".password-entry").hide();
      } else {
        $(".password-entry").show();
      }
    });
    $lds.on("change","#owner_id",function(e){
      e.preventDefault();
      var $dname = $lds.find("#dname");
      if(!$dname.val()) {
        $dname.val($(this).val());
      }
    });
    var passwordFailure = function() {
      alert("no directives returned, try again please.");
      location.reload();
    }
    $lds.on("submit",'.js-ajax-form-auth',function(e){
      e.preventDefault();
      var action = $(this).attr("action");
      if(action==="/login"){
        $.post($(this).attr("action"),formToJSON(this),function(data){
            if(data && data.directives && data.directives[0] ){
              var d = data.directives[0];
              var method = "password";
              if (d.options && d.options.eci){ // successfully logged in
                method = d.options.method || "password";
                if(method==="did" && d.options.pico_id) {
                  return performLogin(d.options);
                }
              }
              var templateId = "#" + method + "-template";
              var methodTemplate = Handlebars.compile($(templateId).html());
              $lds.html(methodTemplate(
                {eci:d.options.eci,eid:"none",nonce:d.options.nonce}));
              $("input")[0].focus();
            }else{
              alert(JSON.stringify(data));
            }
        }, "json");
      }else { // password authentication or account creation
        $.post($(this).attr("action"),formToJSON(this),function(data){
            if(data && data.directives && data.directives[0]){
              var d = data.directives[0];
              if(data.directives[1]){ // display code words instructions
                $lds.html(codeWordsTemplate(
                  {eci:data.directives[1].options.eci,
                   redirect: getCookie("previousUrl") || "/"}));
                return performLogin(d.options,true);
              }
              if (d.options && d.options.pico_id){ // successfully logged in
                performLogin(d.options);
              }else {
                alert("no pico_id found in directive, try again please.");
                location.reload();
              }
            }else{
              passwordFailure();
            }
        }, "json").fail(passwordFailure);
      }
    });
  };
