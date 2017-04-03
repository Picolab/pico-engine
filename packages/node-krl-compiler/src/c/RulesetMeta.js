var _ = require("lodash");

var prop_types = {
    "name": function(props, comp, e){
        if(_.size(props) !== 1){
            throw new Error("only 1 meta.name allowed");
        }
        return comp(_.head(props).value);
    },
    "description": function(props, comp, e){
        if(_.size(props) !== 1){
            throw new Error("only 1 meta.description allowed");
        }
        return comp(_.head(props).value);
    },
    "author": function(props, comp, e){
        if(_.size(props) !== 1){
            throw new Error("only 1 meta.author allowed");
        }
        return comp(_.head(props).value);
    },
    "logging": function(props, comp, e){
        if(_.size(props) !== 1){
            throw new Error("only 1 meta.logging allowed");
        }
        return comp(_.head(props).value);
    },
    "use": function(props, comp, e){
        return e("arr", _.map(props, function(prop){
            var ast = prop.value;
            var obj = {
                kind: e("str", ast.kind, ast.loc),
                rid: e("str", ast.rid.value, ast.rid.loc),
                alias: ast.alias
                    ? e("str", ast.alias.value, ast.alias.loc)
                    : e("str", ast.rid.value, ast.rid.loc)
            };
            if(ast.version){
                obj.version = comp(ast.version);
            }
            if(ast["with"]){
                obj["with"] = e("genfn", ["ctx"], comp(ast["with"]), ast["with"].loc);
            }
            return e("obj", obj, ast.loc);
        }));
    },
    "configure": function(props, comp, e){
        if(_.size(props) !== 1){
            throw new Error("only 1 meta.configure allowed");
        }
        var ast = _.head(props);
        return e("genfn", ["ctx"], comp(ast.value.declarations), ast.value.loc);
    },
    "shares": function(props, comp, e){
        var ids = _.uniqBy(_.flatten(_.map(props, "value.ids")), "value");
        return e("arr", _.map(ids, function(id){
            return e("str", id.value, id.loc);
        }));
    },
    "provides": function(props, comp, e){
        var ids = _.uniqBy(_.flatten(_.map(props, "value.ids")), "value");
        return e("arr", _.map(ids, function(id){
            return e("str", id.value, id.loc);
        }));
    },
    "provides_keys": function(props, comp, e){
        var json = {};
        _.each(props, function(p){
            _.each(p.value.ids, function(id_ast){
                var id = id_ast.value;
                if(!_.has(json, id)){
                    json[id] = {to: []};
                }
                _.each(p.value.rulesets, function(r){
                    json[id].to.push(r.value);
                });
            });
        });
        return e("json", json);
    },
    "keys": function(props, comp, e){
        var obj = {};
        _.each(props, function(p){
            obj[p.value[0].value] = comp(p.value[1]);
        });
        return e("obj", obj);
    }
};

module.exports = function(ast, comp, e){
    return e("obj", _.mapValues(_.groupBy(ast.properties, function(p){
        if(p.type !== "RulesetMetaProperty"){
            throw new Error("RulesetMeta.properties should all be RulesetMetaProperty ast nodes");
        }
        if(p.key.type !== "Keyword"){
            throw new Error("RulesetMetaProperty.key should a Keyword");
        }
        if(_.has(p.value, "operator")){
            if(p.value.operator.type !== "Keyword"){
                throw new Error("RulesetMetaProperty.operator should a Keyword");
            }
            return p.key.value + "_" + p.value.operator.value;
        }
        return p.key.value;
    }), function(props, key){
        if(!_.has(prop_types, key)){
            throw new Error("RulesetMetaProperty not supported: " + key);
        }
        return prop_types[key](props, comp, e);
    }));
};
