var _ = require("lodash");

module.exports = function(){

    var rulesets = {};
    var salience_graph = {};
    //TODO var keys_module_data = {};

    return Object.freeze({
        getRuleset: function(rid){
            return rulesets[rid];
        },
        salient: function(domain, type){
            return _.get(salience_graph, [domain, type], {});
        },
        putRuleset: function(rs){
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
        delRuleset: function(rid){
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
