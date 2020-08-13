window.handlePicoLogin = function(options,formToJSON,callback){
    var immediateLogin = options.immediateLogin || false;
    var getCookie = function(name) {
      var value = "; " + document.cookie;
      var parts = value.split("; " + name + "=");
      if (parts.length == 2) return parts.pop().split(";").shift();
    }
    var delete_cookie = function(name) {
      document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'; //domain=.myDomain.com';
    }
    var performLogin = function(options,owner_needs_time){
      sessionStorage.setItem("owner_pico_id",options.pico_id);
      sessionStorage.setItem("owner_pico_eci",options.eci);
      var redirect = getCookie("previousUrl") || "/";
      if(!owner_needs_time){
        delete_cookie("previousUrl");            //should clear cookie here! Yes!
        location.assign(redirect);
      }
    }
    var loginTemplate = Handlebars.compile($('#login-template').html());
    var ownerTemplate = Handlebars.compile($('#owner-id-template').html());
    var newAccountTemplate = Handlebars.compile($("#new-account-template").html());
    var codeWordsTemplate = Handlebars.compile($("#code-words-template").html());
    $('body').html(loginTemplate({}));
    document.title = $('body h1').html();
    var $lds = $("#login-display-switch");
    $lds.html(ownerTemplate({}));
    $("input")[0].focus();
    $("#user-login").click(function(){
      var ownerPico_id = $("#user-select").val();
      var logged_in_pico = {id:ownerPico_id};
      sessionStorage.setItem("owner_pico_id",ownerPico_id);
      if (ownerPico_id) {
        callback(logged_in_pico);
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
        $.post(action,formToJSON(this),function(data){
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
      }else if(action==="/new-account") { // account creation
        $.post(action,formToJSON(this),function(data){
            if(data && data.directives && data.directives[0]){
              var dir_options = undefined;
              var owner_needs_time = false;
              for(var di=0; di<data.directives.length; ++di){
                var dir = data.directives[di];
                if(dir.name=="new owner pico code query channel"){ // display code words instructions
                  $lds.html(codeWordsTemplate(
                    {eci:dir.options.eci,
                     redirect: getCookie("previousUrl") || "/"}));
                  if(immediateLogin) {
                    owner_needs_time = true;
                  }
                } else if(dir.options && dir.options.pico_id) { // successful creation
                  dir_options = dir.options;
                }
              }
              if (dir_options){ // successfully logged in
                if(immediateLogin) {
                  performLogin(dir_options,owner_needs_time);
                } else if(owner_needs_time) {
                  // next action will come from new owner
                } else {
                  location.reload();
                }
              }else {
                //alert("no pico_id found in directive, try again please.");
                location.reload();
              }
            }else{
              location.reload();
            }
        }, "json").fail(location.reload);
      }else { // password authentication
        $.post(action,formToJSON(this),function(data){
            if(data && data.directives && data.directives[0]){
              var d = data.directives[0];
              if (d.options && d.options.pico_id){ // successfully logged in
                performLogin(d.options);
              }else {
                //alert("no pico_id found in directive, try again please.");
                location.reload();
              }
            }else{
              passwordFailure();
            }
        }, "json").fail(passwordFailure);
      }
    });
  };
