ruleset io.picolabs.visual_params {
  meta {
    shares visualInfo, style, __testing
  }
  global {
    visualInfo = function() {
      info = {
        "width": ent:width,
        "height": ent:height
      };
      info.klog("Visual Info:")
    }
    hexdec1 = function(h) {
      h > "9" => h.ord() - "a".ord() + 10
               | h.ord() - "0".ord()
    }
    hexdec2 = function(twohexchars) {
      c1 = twohexchars.substr(0,1);
      c2 = twohexchars.substr(1,1);
      hexdec1(c1) * 16 + hexdec1(c2)
    }
    colorP = re#.([a-f0-9][a-f0-9])([a-f0-9][a-f0-9])([a-f0-9][a-f0-9])#
    color = function() {
      rgb = ent:color.lc().extract(colorP);
      r = hexdec2(rgb[0]);
      g = hexdec2(rgb[1]);
      b = hexdec2(rgb[2]);
      yiq = (r*0.299)+(g*0.587)+(b*0.114);
      yiq < 128 => "#ffffff" | "#000000"
    }
    style = function() {
      (ent:width => "width:" + ent:width + "px;" | "")
      + (ent:height => "height:" + ent:height + "px;" | "")
      + (ent:left => "left:" + ent:left + "px;" | "")
      + (ent:top => "top:" + ent:top + "px;" | "")
      + "background-color:" + ent:color + ";"
      + "color:" + color()
    }

    __testing = { "queries": [ { "name": "visualInfo" },
                               { "name": "style" },
                               { "name": "__testing" } ],
                  "events": [ { "domain": "visual", "type": "config",
                                "attrs": [ "width", "height" ] } ] }
  }

  rule visual_update {
    select when visual update
             or pico ruleset_added where rid == meta:rid
    pre {
      dname = event:attr("dname")
      color = event:attr("color")
    }
    if dname
      || color
      || rid == "io.picolabs.visual_params"
    then
      noop()
    fired {
      ent:dname := dname;
      ent:color := color.defaultsTo("#cccccc")
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
      ent:left := left.klog("left");
      ent:top := top.klog("top")
    }
  }

  rule visual_config {
    select when visual config
    pre {
      width = event:attr("width").as("String")
      height = event:attr("height").as("String")
    }
    always {
      ent:width := width.klog("width");
      ent:height := height.klog("height")
    }
  }

  rule info_directive {
    select when visual config
    send_directive("visual_config", {"visual_info": visualInfo()})
  }
}
