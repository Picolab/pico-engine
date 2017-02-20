var _ = require("lodash");
var λ = require("contra");
var fs = require("fs");
var diff = require("diff-lines");
var path = require("path");
var test = require("tape");
var compiler = require("./src/");

var files_dir = path.resolve(__dirname, "./test-rulesets");

test("compiler", function(t){
    fs.readdir(files_dir, function(err, files){
        if(err) return t.end(err);

        var basenames = _.uniq(_.map(files, function(file){
            return path.basename(path.basename(file, ".krl"), ".js");
        }));

        λ.each(basenames, function(basename, next){
            var f_js = path.join(files_dir, basename) + ".js";
            var f_krl = path.join(files_dir, basename) + ".krl";
            λ.concurrent({
                js: λ.curry(fs.readFile, f_js, "utf-8"),
                krl: λ.curry(fs.readFile, f_krl, "utf-8")
            }, function(err, srcs){
                if(err) return t.end(err);

                var compiled;
                try{
                    compiled = compiler(srcs.krl).code;
                }catch(e){
                    console.log(e.stack);
                    process.exit(1);//end asap, so they can easily see the error
                }
                compiled = compiled.trim();
                var expected = srcs.js.trim();

                if(compiled === expected){
                    t.ok(true);
                    next();
                }else{
                    console.log("");
                    console.log(path.basename(f_krl) + " -> " + path.basename(f_js));
                    console.log("");
                    console.log(diff(expected, compiled, {
                        n_surrounding: 3
                    }));
                    process.exit(1);//end asap, so they can easily see the diff
                }

                next();
            });
        }, t.end);
    });
});

test("compiler errors", function(t){
    try{
        compiler("ruleset blah {global {ent:a = 1}}\n");
        t.fail("should have thrown up b/c ent:* = * not allowed in global scope");
    }catch(err){
        t.ok(true);
    }
    t.end();
});
