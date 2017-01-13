var _ = require("lodash");
var url = require("url");
var path = require("path");
var express = require("express");
var leveldown = require("leveldown");
var bodyParser = require("body-parser");
var PicoEngine = require("pico-engine-core");
var RulesetLoader = require("./RulesetLoader");
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

  var logs = {};
  var logRID = "io.picolabs.logging";
  var logEntry = function(context,message){
    var eci = context.eci;
    var timestamp = (new Date()).toISOString();
    var episode = logs[eci];
    if (episode) {
      episode.logs.push(timestamp+" "+message);
    } else {
      console.log("[ERROR]","no episode found for",eci);
    }
  };
  var logEpisode = function(pico_id,context,callback){
    var eci = context.eci;
    var episode = logs[eci];
    if (!episode) {
      console.log("[ERROR]","no episode found for",eci);
      return;
    }
    pe.db.getEntVar(pico_id,logRID,"status",function(e,status){
      if (status) {
        pe.db.getEntVar(pico_id,logRID,"logs",function(e,data){
          data[episode.key] = episode.logs;
          pe.db.putEntVar(pico_id,logRID,"logs",data,function(e){
            callback(delete logs[eci]);
          });
        });
      } else {
        callback(delete logs[eci]);
      }
    });
  };
  pe.emitter.on("episode_start", function(context){
    console.log("EPISODE_START",context);
    var eci = context.eci;
    var timestamp = (new Date()).toISOString();
    var episode = logs[eci];
    if (episode) {
      console.log("[ERROR]","episode already exists for",eci);
    } else {
      episode = {};
      episode.key = (
        timestamp + " - " + eci
          + " - " + ((context.event) ? context.event.eid : "query")
        ).replace(/[.]/g, "-");
      episode.logs = [];
      logs[eci] = episode;
    }
  });
  pe.emitter.on("klog", function(context, val, message){
    console.log("[KLOG]", message, val);
    logEntry(context,"[KLOG] "+message+" "+JSON.stringify(val));
  });
  pe.emitter.on("debug", function(context, message){
    console.log("[DEBUG]", context, message);
    var prefix = "";
    if (/^event rec..ved/.test(message)) {
      prefix = context.event.domain + "/" + context.event.type + " ";
    } else if (/^query rec..ved/.test(message)) {
      prefix = context.query.rid + "/" + context.query.name + " ";
    }
    logEntry(context,prefix+message);
  });
  pe.emitter.on("episode_stop", function(context){
    console.log("EPISODE_STOP",context);
    var callback = function(outcome){
      console.log("[EPISODE_REMOVED]",outcome);
    };
    logEpisode(context.pico_id,context,callback);
  });

  var app = express();
  app.use(express.static(path.resolve(__dirname, "..", "public")));
  app.use(bodyParser.json({type: "application/json"}));
  app.use(bodyParser.urlencoded({type: "application/x-www-form-urlencoded", extended: false}));

  var errResp = function(res, err){
    res.statusCode = err.statusCode || 500;
    res.end(err.message);
  };


  app.all("/sky/event/:eci/:eid/:domain/:type", function(req, res){
    var event = {
      eci: req.params.eci,
      eid: req.params.eid,
      domain: req.params.domain,
      type: req.params.type,
      attrs: _.assign({}, req.query, req.body)
    };
    pe.signalEvent(event, function(err, response){
      if(err) return errResp(res, err);
      res.json(response);
    });
  });

  app.all("/sky/cloud/:eci/:rid/:function", function(req, res){
    var query = {
      eci: req.params.eci,
      rid: req.params.rid,
      name: req.params["function"],
      args: _.assign({}, req.query, req.body)
    };
    pe.runQuery(query, function(err, data){
      if(err) return errResp(res, err);
      if(_.isFunction(data)){
        data(res);
      }else{
        res.json(data);
      }
    });
  });

  app.all("/api/db-dump", function(req, res){
    pe.db.toObj(function(err, db_data){
      if(err) return errResp(res, err);
      res.json(db_data);
    });
  });

  app.all("/old", function(req, res){
    pe.db.toObj(function(err, db_data){
      if(err) return errResp(res, err);

      var html = "";
      html += "<html>\n<body>\n";
      html += "<h1>http://localhost:" + port + "</h1>\n";
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

  app.all("/api/owner-channel", function(req, res){
    pe.db.getFirstChannel(function(err, first_channel){
      if(err) return errResp(res, err);
      res.end(JSON.stringify(first_channel, undefined, 2));
    });
  });

  app.all("/api/new-pico", function(req, res){
    pe.db.newPico({}, function(err, new_pico){
      if(err) return errResp(res, err);
      res.end(JSON.stringify(new_pico, undefined, 2));
    });
  });

  app.all("/api/rm-pico/:id", function(req, res){
    pe.db.removePico(req.params.id, function(err){
      if(err) return errResp(res, err);
      res.json({ok: true});
    });
  });

  app.all("/api/pico/:id/new-channel", function(req, res){
    pe.db.newChannel({
      pico_id: req.params.id,
      name: req.query.name,
      type: req.query.type
    }, function(err, new_channel){
      if(err) return errResp(res, err);
      res.json(new_channel);
    });
  });

  app.all("/api/pico/:id/rm-channel/:eci", function(req, res){
    pe.db.removeChannel(req.params.id, req.params.eci, function(err){
      if(err) return errResp(res, err);
      res.json({ok: true});
    });
  });

  app.all("/api/pico/:id/rm-ruleset/:rid", function(req, res){
    pe.db.removeRuleset(req.params.id, req.params.rid, function(err){
      if(err) return errResp(res, err);
      res.json({ok: true});
    });
  });

  app.all("/api/pico/:id/add-ruleset", function(req, res){
    pe.db.addRuleset({pico_id: req.params.id, rid: req.query.rid}, function(err){
      if(err) return errResp(res, err);
      res.json({ok: true});
    });
  });

  app.all("/api/ruleset/compile", function(req, res){
    var src = _.get(url.parse(req.url, true), ["query", "src"]);
    try{
      res.json({ code: compiler(src).code});
    }catch(err){
      res.json({ error: err.toString() });
    }
  });

  app.all("/api/ruleset/register", function(req, res){
    var src = _.get(url.parse(req.url, true), ["query", "src"]);

    pe.db.registerRuleset(src, function(err){
      if(err) return errResp(res, err);
      res.json({ok: true});
    });
  });

  app.all("/api/ruleset/enable/:hash", function(req, res){
    pe.db.enableRuleset(req.params.hash, function(err){
      if(err) return errResp(res, err);
      res.json({ok: true});
    });
  });

  app.all("/api/ruleset/install/:rid", function(req, res){
    pe.installRID(req.params.rid, function(err){
      if(err) return errResp(res, err);
      res.json({ok: true});
    });
  });

  app.all("/api/ruleset/disable/:rid", function(req, res){
    pe.db.disableRuleset(req.params.rid, function(err){
      if(err) return errResp(res, err);
      res.json({ok: true});
    });
  });

  app.listen(port, function () {
    console.log("http://localhost:" + port);
  });
});
