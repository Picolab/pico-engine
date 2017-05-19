var _ = require("lodash");

module.exports = function(){

    var rulesets = {};
    var salience_graph = {};
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

            //now setup `salience_graph` and `rulesets`
            _.each(salience_graph, function(data_d, domain){
                _.each(data_d, function(data_t, type){
                    //clear out any old versions graph
                    _.unset(salience_graph, [domain, type, rs.rid]);
                });
            });
            _.each(rs.rules, function(rule){
                rule.rid = rs.rid;
                _.each(rule.select && rule.select.graph, function(g, domain){
                    _.each(g, function(exprs, type){
                        _.set(salience_graph, [domain, type, rule.rid, rule.name], true);
                    });
                });
            });
            rulesets[rs.rid] = rs;
        },
        del: function(rid){
            if(_.has(rulesets, rid)){
                _.each(rulesets[rid].rules, function(rule){
                    _.each(rule.select && rule.select.graph, function(g, domain){
                        _.each(g, function(exprs, type){
                            _.unset(salience_graph, [domain, type, rid]);
                        });
                    });
                });
                delete rulesets[rid];
            }
        },
        getRule: function(rid, name){
            return _.get(rulesets, [rid, "rules", name]);
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
        salient: function(domain, type){
            return _.get(salience_graph, [domain, type], {});
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
