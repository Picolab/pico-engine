var _ = require("lodash");
var url = require("url");
var path = require("path");
var http = require("http");
var leveldown = require("leveldown");
var PicoEngine = require("pico-engine-core");
var serveStatic = require("ecstatic")({root: path.resolve(__dirname, "..", "public")});
var RulesetLoader = require("./RulesetLoader");
var HttpHashRouter = require("http-hash-router");

////////////////////////////////////////////////////////////////////////////////
var port = process.env.PORT || 8080;
var pico_engine_home = process.env.PICO_ENGINE_HOME || path.resolve(__dirname, "..");
////////////////////////////////////////////////////////////////////////////////

var pe = PicoEngine({
  compileAndLoadRuleset: RulesetLoader({
    rulesets_dir: path.resolve(pico_engine_home, "rulesets")
  }),
  db: {
    db: leveldown,
    location: path.join(pico_engine_home, "db")
  }
});

pe.emitter.on("klog", function(val, message){
  console.log("[KLOG] ", val, message);
});
pe.emitter.on("debug", function(kind, context, message){
  console.log("[DEBUG]", kind, context, message);
});

var router = HttpHashRouter();

var jsonResp = function(res, data){
  res.end(JSON.stringify(data, undefined, 2));
};

var errResp = function(res, err){
  res.statusCode = err.statusCode || 500;
  res.end(err.message);
};


router.set("/sky/event/:eci/:eid/:domain/:type", function(req, res, route){
  var event = {
    eci: route.params.eci,
    eid: route.params.eid,
    domain: route.params.domain,
    type: route.params.type,
    attrs: route.data
  };
  pe.signalEvent(event, function(err, response){
    if(err) return errResp(res, err);
    jsonResp(res, response);
  });
});

router.set("/sky/cloud/:eci/:rid/:function", function(req, res, route){
  var query = {
    eci: route.params.eci,
    rid: route.params.rid,
    name: route.params["function"],
    args: route.data
  };

  pe.runQuery(query, function(err, data){
    if(err) return errResp(res, err);
    if(_.isFunction(data)){
      data(res);
    }else{
      jsonResp(res, data);
    }
  });
});

router.set("/api/db-dump", function(req, res, route){
  pe.db.toObj(function(err, db_data){
    if(err) return errResp(res, err);
    jsonResp(res, db_data);
  });
});

router.set("/old", function(req, res, route){
  pe.db.toObj(function(err, db_data){
    if(err) return errResp(res, err);

    var html = "";
    html += "<html>\n<body>\n";
    html += "<h1>http://localhost:" + server.address().port + "</h1>\n";
    html += "<h2>Picos</h2>\n";
    _.each(db_data.pico, function(pico){
      html += "<div style=\"margin-left:2em\">\n";
      html += "<h3>"+pico.id+"</h3>\n";
      html += "<div style=\"margin-left:2em\">\n";

      html += "<h4>Channels</h4>\n";
      html += "<ul>\n";
      _.each(pico.channel, function(chan){
        var rm_link = "/api/pico/"+pico.id+"/rm-channel/"+chan.id;
        html += "<li>"+JSON.stringify(chan)+" <a href=\""+rm_link+"\">del</a></li>\n";
      });
      html += "</ul>\n";

      html += "<form action=\"/api/pico/"+pico.id+"/new-channel\" method=\"GET\">\n";
      html += "<input type=\"text\" name=\"name\" placeholder=\"name...\">\n";
      html += "<input type=\"text\" name=\"type\" placeholder=\"type...\">\n";
      html += "<button type=\"submit\">add channel</button>\n";
      html += "</form>\n";

      html += "<h4>Rulesets</h4>\n";
      html += "<ul>\n";
      _.each(pico.ruleset, function(d, rid){
        var rm_link = "/api/pico/"+pico.id+"/rm-ruleset/"+rid;
        html += "<li>"+rid+" <a href=\""+rm_link+"\">del</a></li>\n";
        html += "<ul>\n";
        _.each(_.get(db_data, ["pico", pico.id, rid, "vars"]),
               function(v,k){
                 html += "<li>"+k+"="+JSON.stringify(v)+"</li>\n";
               });
        html += "</ul>\n";
      });
      html += "</ul>\n";

      html += "<form action=\"/api/pico/"+pico.id+"/add-ruleset\" method=\"GET\">\n";
      html += "<input type=\"text\" name=\"rid\" placeholder=\"Ruleset id...\">\n";
      html += "<button type=\"submit\">add ruleset</button>\n";
      html += "</form>\n";

      html += "</div>\n";
      html += "</div>\n";
    });
    html += "<div style=\"margin-left:2em\">\n";
    html += "<a href=\"/api/new-pico\">add pico</a>\n";
    html += "</div>\n";
    html += "<h2>Rulesets</h2>\n";
    _.each(_.get(db_data, ["rulesets", "versions"]), function(versions, rid){
      var enabled_hash = _.get(db_data, ["rulesets", "enabled", rid, "hash"]);
      html += "<div style=\"margin-left:2em\">\n";
      html += "<h3>"+rid+"</h3>\n";
      _.each(versions, function(hashes, timestamp){
        _.each(hashes, function(is_there, hash){
          if(!is_there){
            return;
          }
          html += "<div style=\"margin-left:2em\">\n";
          html += timestamp + " | " + hash + " | ";
          if(hash === enabled_hash){
            html += "<a href=\"/api/ruleset/disable/"+rid+"\">disable</a>";
            html += " | ";
            if(pe.isInstalled(rid)){
              html += "uninstall";
            }else{
              html += "<a href=\"/api/ruleset/install/"+rid+"\">install</a>";
            }
            var the_krl_src = _.get(db_data, ["rulesets", "krl", enabled_hash, "src"]);
            html += "<pre>" + the_krl_src + "</pre>\n";
          }else{
            html += "<a href=\"/api/ruleset/enable/"+hash+"\">enable</a>";
          }
          html += "</div>\n";
        });
      });
      html += "</div>\n";
    });
    html += "<form action=\"/api/ruleset/register\" method=\"GET\">\n";
    html += "<textarea name=\"src\"></textarea>\n";
    html += "<button type=\"submit\">register ruleset</button>\n";
    html += "</form>\n";
    html += "<hr/>\n";
    html += "<a href=\"/api/db-dump\">raw database dump</a>\n";
//    html += "<pre>\n" + JSON.stringify(db_data, undefined, 2) + "\n</pre>\n";
    html += "</body>\n</html>\n";
    res.end(html);
  });
});

router.set("/api/new-pico", function(req, res, route){
  pe.db.newPico({}, function(err, new_pico){
    if(err) return errResp(res, err);
    res.end(JSON.stringify(new_pico, undefined, 2));
  });
});

router.set("/api/rm-pico/:id", function(req, res, route){
  pe.db.removePico(route.params.id, function(err){
    if(err) return errResp(res, err);
    jsonResp(res, {ok: true});
  });
});

router.set("/api/pico/:id/new-channel", function(req, res, route){
  pe.db.newChannel({
    pico_id: route.params.id,
    name: route.data.name,
    type: route.data.type
  }, function(err, new_channel){
    if(err) return errResp(res, err);
    res.end(JSON.stringify(new_channel, undefined, 2));
  });
});

router.set("/api/pico/:id/rm-channel/:eci", function(req, res, route){
  pe.db.removeChannel(route.params.id, route.params.eci, function(err){
    if(err) return errResp(res, err);
    jsonResp(res, {ok: true});
  });
});

router.set("/api/pico/:id/rm-ruleset/:rid", function(req, res, route){
  pe.db.removeRuleset(route.params.id, route.params.rid, function(err){
    if(err) return errResp(res, err);
    jsonResp(res, {ok: true});
  });
});

router.set("/api/pico/:id/add-ruleset", function(req, res, route){
  pe.db.addRuleset({pico_id: route.params.id, rid: route.data.rid}, function(err){
    if(err) return errResp(res, err);
    jsonResp(res, {ok: true});
  });
});

router.set("/api/ruleset/register", function(req, res, route){
  var src = _.get(url.parse(req.url, true), ["query", "src"]);

  pe.db.registerRuleset(src, function(err){
    if(err) return errResp(res, err);
    jsonResp(res, {ok: true});
  });
});

router.set("/api/ruleset/enable/:hash", function(req, res, route){
  pe.db.enableRuleset(route.params.hash, function(err){
    if(err) return errResp(res, err);
    jsonResp(res, {ok: true});
  });
});

router.set("/api/ruleset/install/:rid", function(req, res, route){
  pe.installRID(route.params.rid, function(err){
    if(err) return errResp(res, err);
    jsonResp(res, {ok: true});
  });
});

router.set("/api/ruleset/disable/:rid", function(req, res, route){
  pe.db.disableRuleset(route.params.rid, function(err){
    if(err) return errResp(res, err);
    jsonResp(res, {ok: true});
  });
});

var server = http.createServer(function(req, res){
  router(req, res, {
    data: url.parse(req.url, true).query
  }, function(err){
    if(err){
      if(err.type === "http-hash-router.not-found"){
        serveStatic(req, res);
        return;
      }
      errResp(res, err);
    }
  });
});

server.listen(port, function(){
  console.log("http://localhost:" + server.address().port);
});
