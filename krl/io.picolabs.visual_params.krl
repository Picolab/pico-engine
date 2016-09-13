ruleset io.picolabs.visual_params {
  meta {
    shares visualInfo, style
  }
  global {
    visualInfo = function() {
      info = {
        "width": ent:width,
        "height": ent:height
      };
      info.klog("Visual Info:")
    }
    style = function() {
      stuff = width => "width:" + ent:width + "px;" | ""
            + "left:" + ent:left + "px;"
            + "top:" + ent:top + "px;"
            + "background-color:" + ent:color;
      stuff.klog("style:")
    }
  }

  rule visual_update {
    select when visual update
    pre {
      dname = event:attr("dname")
      color = event:attr("color").defaultsTo("#ccc")
    }
    always {
      ent:dname = dname;
      ent:color = color
    }
  }

  rule visual_moved {
    select when visual moved
    pre {
      left = event:attr("left").as("String")
      top = event:attr("top").as("String")
    }
    if left != ent:left || top != ent:top then noop()
    fired {
      ent:left = left.klog("left");
      ent:top = top.klog("top")
    }
  }

  rule visual_config {
    select when visual config
    pre {
      width = event:attr("width").defaultsTo("100").as("String")
      height = event:attr("height").defaultsTo("100").as("String")
    }
    always {
      ent:width = width.klog("width");
      ent:height = height.klog("height")
    }
  }

  rule info_directive {
    select when visual config
    send_directive("visual_config")
      with visual_info = visualInfo()
  }
}
