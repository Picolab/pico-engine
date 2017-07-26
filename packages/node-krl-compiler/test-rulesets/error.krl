ruleset io.picolabs.error {
    meta {
        shares getErrors
    }
    global {
        getErrors = function(){
            ent:error_log;
        }
    }
    rule error_handle {
        select when system error
        fired {
            ent:error_log := ent:error_log.append(event:attrs())
        }
    }
    rule basic0 {
        select when error basic

        send_directive("basic0");

        fired {
            error info "some info error"
        }
    }
    rule basic1 {
        select when error basic

        send_directive("basic1");

        fired {
            error info "this should not fire, b/c basic0 stopped execution"
        }
    }
    rule stop_on_error {
        select when error stop_on_error

        send_directive("stop_on_error");

        fired {
            error info "stop_on_error 1";
            error info "stop_on_error 2 this should not fire b/c the first error stops execution"
        }
    }
}
