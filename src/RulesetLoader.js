var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var compiler = require("krl-compiler");
var version_key = [
    require("pico-engine-core/package.json").version,
    require("krl-compiler/package.json").version
].join("-");

var fsExist = function(file_path, callback){
    fs.stat(file_path, function(err, stats){
        if(err){
            if(err.code === "ENOENT"){
                return callback(undefined, false);
            }else{
                return callback(err);
            }
        }
        callback(undefined, true);
    });
};

var storeFile = function(file_path, src, callback){
    mkdirp(path.dirname(file_path), function(err){
        if(err) return callback(err);
        fs.writeFile(file_path, src, {
            encoding: "utf8"
        }, callback);
    });
};


module.exports = function(conf){
    var rulesets_dir = conf.rulesets_dir;

    return function(rs_info, callback){
        var hash = rs_info.hash;
        var krl_src = rs_info.src;

        var file = path.resolve(
            rulesets_dir,
            version_key,
            hash.substr(0, 2),
            hash.substr(2, 2),
            hash + ".js"
        );
        fsExist(file, function(err, does_exist){
            if(err) return callback(err);
            if(does_exist){
                callback(undefined, require(file));
                return;
            }
            var js_src;
            try{
                js_src = compiler(krl_src, {
                    inline_source_map: true
                }).code;
            }catch(err){
                return callback(err);
            }
            storeFile(file, js_src, function(err){
                if(err) return callback(err);
                callback(undefined, require(file));
            });
        });
    };
};
