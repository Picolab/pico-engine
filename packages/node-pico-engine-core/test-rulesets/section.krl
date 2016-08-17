ruleset io.picolabs.registration {
  meta {
    name "Section"
    description <<
A test ruleset for Registration
>>
    author "Aaron Rasmussen"
    logging on
    shares sectionInfo
 
  }
  global {

    sectionInfo = function() {
      info = {
        "capacity": ent:capacity,
        "taken": ent:taken,
        "remaining": ent:capacity - ent:taken
      };
      info.klog("Section Info: ")
    }

 
  }
  
  rule config is active {
    select when section config
    pre {
      capacity = event:attr("capacity")
      taken = event:attr("taken")
    }
    always {
      ent:capacity = capacity;
      ent:taken = taken.as("Number")
    }
  }

  rule join_section is active {
    select when section add_request
    if ent:taken < ent:capacity then noop()
    fired {
      ent:taken = (ent:taken + 1).klog("new ent:taken")
    }
  }

  rule drop_section is active {
    select when section drop_request
    if ent:taken > 0 then noop()
    fired {
      ent:taken = (ent:taken - 1).klog("new ent:taken")
    }
    
  }

  rule info_directive is active {
    select when (section add_request  or 
        section drop_request) or
        section config
    send_directive("section") with
      section_info = sectionInfo()
  }
 
}
