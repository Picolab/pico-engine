ruleset io.picolabs.test.flush_reinstall {
  meta {
    description <<
      Counts wrangler:ruleset_installed. A flush of an installed ruleset must
      not increment this. The rid is dotted on purpose, since the old
      url-parsing logic truncated dotted rids.
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
