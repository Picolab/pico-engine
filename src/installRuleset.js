var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var mkdirp = require('mkdirp');

var fsExist = function(file_path, callback){
  fs.stat(file_path, function(err, stats){
    if(err){
      if(err.code === 'ENOENT'){
        return callback(undefined, false);
      }else{
        return callback(err);
      }
    }
    callback(undefined, true);
  });
};

var storeFile = function(file_path, src, callback){
  mkdirp(path.dirname(file_path), {
    mode: 0770// eslint-disable-line
  }, function(err){
    if(err) return callback(err);
    fs.writeFile(file_path, src, {
      encoding: 'utf8',
      mode: 0440// eslint-disable-line
    }, callback);
  });
};

module.exports = function(rulesets_dir, src, callback){
  var shasum = crypto.createHash('sha256');
  shasum.update(src);
  var hash = shasum.digest('hex');
  var file_path = path.join(
    rulesets_dir,
    hash.substr(0, 2),
    hash.substr(2, 2),
    hash + '.krl'
  );
  fsExist(file_path, function(err, does_exist){
    if(err) return callback(err);
    if(does_exist){
      return callback(undefined, 'already exists');
    }
    storeFile(file_path, src, callback);
  });
};
