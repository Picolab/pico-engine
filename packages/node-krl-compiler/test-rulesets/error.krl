ruleset io.picolabs.error {
  meta {
    shares getErrors
  }
  global {
    getErrors = function(){
      ent:error_log
    }
  }
  rule error_handle {
    select when system error;
    fired {
      ent:error_log := ent:error_log.append(event:attrs())
    }
  }
  rule basic {
    select when error basic;
    fired {
      error info "some info error";
    }
  }
}
