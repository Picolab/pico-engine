ruleset io.picolabs.layer2_event_send_test {
  rule send_by_did {
    select when layer2_event_send_test send

    pre {
      did = event:attr("did")
      domain = event:attr("domain")
      type = event:attr("type")
      attrs = event:attr("attrs").defaultsTo({})
    }

    every {
      event:send({
        "did": did,
        "domain": domain,
        "type": type,
        "attrs": attrs
      });

      send_directive("sent", {"did": did});
    }
  }

  rule send_by_sub {
    select when layer2_event_send_test send_sub

    pre {
      sub = event:attr("sub")
      domain = event:attr("domain")
      type = event:attr("type")
      attrs = event:attr("attrs").defaultsTo({})
    }

    every {
      event:send({
        "sub": sub,
        "domain": domain,
        "type": type,
        "attrs": attrs
      });

      send_directive("sent_sub", {"did": sub{"Tx_did"}});
    }
  }
}
