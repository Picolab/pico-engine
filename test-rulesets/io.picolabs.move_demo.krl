ruleset io.picolabs.move_demo {
  meta {
    shares getLabel
  }

  global {
    getLabel = function() {
      ent:label
    }
  }

  rule setLabel {
    select when move_demo setLabel
    always {
      ent:label := event:attr("label")
    }
  }
}
