ruleset io.picolabs.log {
  rule levels {
    select when log levels;
    fired{
      log "hello default";
      log error "hello error";
      log warn  "hello warn";
      log info  "hello info";
      log debug "hello debug"
    }
  }
}
