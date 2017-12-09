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
            ent:error_log := ent:error_log.append(event:attrs)
        }
    }
    rule continue_on_errorA {
        select when error continue_on_error

        send_directive("continue_on_errorA");

        always {
            error debug "continue_on_errorA debug";
            error info "continue_on_errorA info";
            error warn "continue_on_errorA warn"
        }
    }
    rule continue_on_errorB {
        select when error continue_on_error

        send_directive("continue_on_errorB");

        always {
            error debug "continue_on_errorB debug";
            error info "continue_on_errorB info";
            error warn "continue_on_errorB warn"
        }
    }
    rule stop_on_errorA {
        select when error stop_on_error

        send_directive("stop_on_errorA");

        always {
            error error "stop_on_errorA 1";
            error error "stop_on_errorA 2 this should not fire b/c the first error stops execution"
        }
    }
    rule stop_on_errorB {
        select when error stop_on_error

        send_directive("stop_on_errorB");

        always {
            error error "stop_on_errorB 3 this should not fire b/c the first error clears the schedule"
        }
    }
}
