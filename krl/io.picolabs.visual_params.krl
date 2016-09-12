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
      stuff = "width:" + ent:width.as("String") + "px;"
            + "left:" + ent:left.as("String") + "px;"
            + "top:" + ent:top.as("String") + "px;"
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
      left = event:attr("left")
      top = event:attr("top")
    }
    if left != ent:left || top != ent:top then noop()
    fired {
      ent:left = left.as("Number").klog("left");
      ent:top = top.as("Number").klog("top")
    }
  }

  rule visual_config {
    select when visual config
    pre {
      width = event:attr("width")
      height = event:attr("height")
    }
    always {
      ent:width = width.defaultsTo("100").as("Number").klog("width");
      ent:height = height.defaultsTo("100").as("Number").klog("height")
    }
  }

  rule info_directive {
    select when visual config
    send_directive("visual_config")
      with visual_info = visualInfo()
  }
}
