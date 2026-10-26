ruleset io.picolabs.test.flush_reinstall {
  meta {
    description <<
      Test fixture for io.picolabs.pico-engine-ui reinstall_after_flush: counts how
      many times it has been installed on the pico. Its rid is dotted on purpose,
      since the old url-parsing logic truncated dotted rids.
    >>
    shares installs
  }
  global {
    installs = function() {
      ent:installs.defaultsTo(0)
    }
  }
  rule count_install {
    select when wrangler ruleset_installed where event:attr("rids") >< ctx:rid
    always {
      ent:installs := ent:installs.defaultsTo(0) + 1
    }
  }
}
