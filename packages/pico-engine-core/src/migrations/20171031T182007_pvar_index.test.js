var _ = require("lodash");
var cuid = require("cuid");
var test = require("tape");
var encode = require("encoding-down");
var dbRange = require("../dbRange");
var levelup = require("levelup");
var memdown = require("memdown");
var bytewise = require("bytewise");
var safeJsonCodec = require("level-json-coerce-null");
var migration = require("./20171031T182007_pvar_index");

test("migration - pvar_index", function(t){
    var ldb = levelup(encode(memdown(cuid()), {
        keyEncoding: bytewise,
        valueEncoding: safeJsonCodec,
    }));
    var db_ops = [];
    var put = function(varname, value){
        db_ops.push({
            type: "put",
            key: ["entvars", "p0", "r0", varname],
            value: value,
        });
        db_ops.push({
            type: "put",
            key: ["appvars", "r0", varname],
            value: value,
        });
    };

    put("v0", {foo: "bar", baz: 1});
    put("v1", [1, 2, 3, "ok"]);
    put("v2", "hi");
    put("v3", true);
    put("v4", void 0);
    put("v5", 123.45);

    ldb.batch(db_ops, function(err){
        if(err) return t.end(err);
        migration.up(ldb, function(err){
            if(err) return t.end(err);
            var entvars = {};
            var appvars = {};
            dbRange(ldb, {
                prefix: [],
            }, function(data){
                if(data.key[0] === "entvars"){
                    _.set(entvars, data.key.slice(3), data.value);
                }else if(data.key[0] === "appvars"){
                    _.set(appvars, data.key.slice(2), data.value);
                }
            }, function(err){
                if(err) return t.end(err);

                t.deepEquals(entvars, appvars, "ent and app should be the same for these tests");

                t.deepEquals(entvars.v0, {
                    type: "Map",
                    value: {foo: "bar", baz: 1},
                });
                t.deepEquals(entvars.v1, {
                    type: "Array",
                    value: [1, 2, 3, "ok"],
                });
                t.deepEquals(entvars.v2, {
                    type: "String",
                    value: "hi",
                });
                t.deepEquals(entvars.v3, {
                    type: "Boolean",
                    value: true,
                });
                t.deepEquals(entvars.v4, {
                    type: "Null",
                    value: null,
                });
                t.deepEquals(entvars.v5, {
                    type: "Number",
                    value: 123.45,
                });

                t.end();
            });
        });
    });
});
