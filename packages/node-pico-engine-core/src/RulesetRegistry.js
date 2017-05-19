var _ = require("lodash");

var SalienceGraph = function(){
    var graph = {};
    var put = function(rs){
        del(rs.rid);//clear out the old one, if pressent
        _.each(rs.rules, function(rule){
            rule.rid = rs.rid;
            _.each(rule.select && rule.select.graph, function(g, domain){
                _.each(g, function(exprs, type){
                    _.set(graph, [domain, type, rule.rid, rule.name], true);
                });
            });
        });
    };
    var get = function(domain, type){
        return _.get(graph, [domain, type], {});
    };
    var del = function(rid){
        _.each(graph, function(data_d, domain){
            _.each(data_d, function(data_t, type){
                //clear out any old versions graph
                _.unset(graph, [domain, type, rid]);
            });
        });
    };
    return Object.freeze({
        put: put,
        get: get,
        del: del,
    });
};

module.exports = function(){

    var rulesets = {};
    var salience_graph = SalienceGraph();
    var keys_module_data = {};

    return Object.freeze({
        get: function(rid){
            return rulesets[rid];
        },
        put: function(rs){
            if(true
                && _.has(rs, "meta.keys")
                && _.has(rs, "meta.provides_keys")
            ){
                _.each(rs.meta.provides_keys, function(p, key){
                    _.each(p.to, function(to_rid){
                        _.set(keys_module_data, [
                            "provided",
                            rs.rid,
                            to_rid,
                            key
                        ], _.cloneDeep(rs.meta.keys[key]));
                    });
                });
            }

            if(_.has(rs, "meta.keys")){
                //"remove" keys so they don't leak out
                //don't use delete b/c it mutates the loaded rs
                rs = _.assign({}, rs, {
                    meta: _.omit(rs.meta, "keys")
                });
            }

            salience_graph.put(rs);
            rulesets[rs.rid] = rs;
        },
        del: function(rid){
            salience_graph.del(rid);
            delete rulesets[rid];
        },
        provideKey: function(rid, use_rid){
            if(_.has(keys_module_data, ["provided", use_rid, rid])){
                _.set(keys_module_data, [
                    "used_keys",
                    rid,
                ], keys_module_data.provided[use_rid][rid]);
            }
        },
        getKey: function(rid, key_id){
            return _.get(keys_module_data, ["used_keys", rid, key_id]);
        },
        salientRules: function(domain, type, ridFilter){
            var to_run = salience_graph.get(domain, type);
            var rules_to_select = [];
            _.each(to_run, function(rules, rid){
                if(!ridFilter(rid)){
                    return;
                }
                _.each(rules, function(is_on, rule_name){
                    if(!is_on){
                        return;
                    }
                    var rule = _.get(rulesets, [rid, "rules", rule_name]);
                    if(!rule){
                        return;
                    }
                    //shallow clone with it's own scope for this run
                    rules_to_select.push(_.assign({}, rule, {
                        scope: rulesets[rid].scope.push()
                    }));
                });
            });
            return rules_to_select;
        },
        assertNoDependants: function(rid){
            _.each(rulesets, function(rs){
                _.each(rs.modules_used, function(info){
                    if(info.rid === rid){
                        throw new Error("\"" + rid + "\" is depended on by \"" + rs.rid + "\"");
                    }
                });
            });
        },
    });
};
