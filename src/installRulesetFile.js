var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");

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

module.exports = function(file, js_src, callback){
  fsExist(file, function(err, does_exist){
    if(err) return callback(err);
    if(does_exist){
      callback(undefined, require(file));
      return;
    }
    storeFile(file, js_src, function(err){
      if(err) return callback(err);
      callback(undefined, require(file));
    });
  });
};
