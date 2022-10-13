ruleset io.picolabs.didx {
    meta {
      name "didx"
      description <<
        
      >>
      author ""
      //modules it uses
      use module io.picolabs alias picolabs //FIX ME
      provides established, outbound, inbound, wellKnown_Rx, autoAcceptConfig
      shares   established, outbound, inbound, wellKnown_Rx, autoAcceptConfig
      logging on
    }
  
    global{
    }
}