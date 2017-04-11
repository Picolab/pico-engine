var λ = require("contra");
var fs = require("fs");
var diff = require("diff-lines");
var path = require("path");
var parser = require("krl-parser");
var generator = require("./");
var commentsRegExp = require("comment-regex");

var files_dir = path.resolve(__dirname, "../test-rulesets");

var allDone = function(err){
    if(err){
        console.error("FAILED! " + err);
        process.exit(1);
    }else{
        console.log("PASSED!");
    }
};

console.log();
console.log("Starting tests...");
fs.readdir(files_dir, function(err, files){
    if(err) return allDone(err);
    λ.each.series(files, function(file, next){
        fs.readFile(path.resolve(files_dir, file), "utf-8", function(err, src){
            if(err) return next(err);

            console.log("testing: " + path.basename(file));

            var out = generator(parser(src, {filename: file}));
            var expected = src.replace(commentsRegExp(), "").trim();

            if(out === expected){
                console.log("  ...passed");
                next();
            }else{
                console.log();
                console.log(diff(expected, out, {n_surrounding: 3}));
                console.log();
                console.log("testing: " + path.basename(file));
                next(new Error("see diff"));
            }
        });
    }, allDone);
});
