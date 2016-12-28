var _ = require("lodash");
var url = require("url");
var path = require("path");
var http = require("http");
var leveldown = require("leveldown");
var PicoEngine = require("pico-engine-core");
var serveStatic = require("ecstatic")({root: path.resolve(__dirname, "..", "public")});
var RulesetLoader = require("./RulesetLoader");
var HttpHashRouter = require("http-hash-router");
var compiler = require("krl-compiler");

////////////////////////////////////////////////////////////////////////////////
var port = process.env.PORT || 8080;
var pico_engine_home = process.env.PICO_ENGINE_HOME || path.resolve(__dirname, "..");
////////////////////////////////////////////////////////////////////////////////

PicoEngine({
  compileAndLoadRuleset: RulesetLoader({
    rulesets_dir: path.resolve(pico_engine_home, "rulesets")
  }),
  db: {
    db: leveldown,
    location: path.join(pico_engine_home, "db")
  }
}, function(err, pe){
  if(err){
    throw err;
  }

  var logRID = "io.picolabs.logging";
  var startEpisode = function(pico_id,key,timestamp,message){
    pe.db.getEntVar(pico_id,logRID,"logs",function(e,data){
      data[key] = [timestamp+" "+message];
      pe.db.putEntVar(pico_id,logRID,"logs",data,function(e){
        if (e) console.log("ERROR",e);
        console.log(key);
      });
    });
  };
  var extendEpisode = function(pico_id,timestamp,message) {
    pe.db.getEntVar(pico_id,logRID,"logs",function(e,data){
      var key = Object.keys(data).pop();
      if (key && data[key]) {
        data[key].push(timestamp+" "+message);
      }
      pe.db.putEntVar(pico_id,logRID,"logs",data,function(e){
        if (e) console.log("ERROR",e);
        console.log(timestamp, message);
      });
    });
  };
  var handleLog = function(pico_id,dlog,key,timestamp,message){
    if (pico_id) {
      pe.db.getPico(pico_id,function(err,pico){
        if (!pico[logRID]) {
          dlog();
        } else if (_.get(pico,[logRID, "vars", "status"])) {
          if (key && /event rec..ved$/.test(message)) {
            startEpisode(pico_id,key,timestamp,message);
          } else {
            extendEpisode(pico_id,timestamp,message);
          }
        }
      });
    } else {
      dlog();
    }
  };
  pe.emitter.on("klog", function(context, val, message){
    var defaultLog = function(){
      console.log("[KLOG]", message, val);
    };
    var timestamp = (new Date()).toISOString();
    if (context.pico_id) {
      handleLog(context.pico_id,defaultLog,undefined,timestamp,
        "[KLOG] "+message+" "+val);
    } else {
      defaultLog();
    }
  });
  pe.emitter.on("debug", function(context, message){
    var defaultLog = function(){
      console.log("[DEBUG]", context, message);
    };
    var timestamp = (new Date()).toISOString();
    var eci = _.get(context,["event","eci"]);
    var key = timestamp.replace(".","-") + " - " + eci
      + ((context.event) ? " - " + context.event.eid : "");
    if (context.pico_id) {
      handleLog(context.pico_id,defaultLog,key,timestamp,message);
    } else if (eci) {
      pe.db.getPicoIDByECI(eci,function(err,pid){
        handleLog(pid,defaultLog,key,timestamp,message);
      });
    } else {
      defaultLog();
    }
  });

  var router = HttpHashRouter();

  var jsonResp = function(res, data){
    res.writeHead(200, {"Content-Type": "application/json"});
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

  router.set("/api/owner-channel", function(req, res, route){
    pe.db.getFirstChannel(function(err, first_channel){
      if(err) return errResp(res, err);
      res.end(JSON.stringify(first_channel, undefined, 2));
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

  router.set("/api/ruleset/compile", function(req, res, route){
    var src = _.get(url.parse(req.url, true), ["query", "src"]);
    try{
      jsonResp(res, { code: compiler(src).code});
    }catch(err){
      jsonResp(res, { error: err.toString() });
    }
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
});
