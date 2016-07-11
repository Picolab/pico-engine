var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
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

var compileFile = function(src_file, out_file, callback){
  var src = fs.createReadStream(src_file);
  var out = fs.createWriteStream(out_file, {
    mode: 0660// eslint-disable-line
  });

  //spawn a process, so we don't lock up the running server
  var proc = spawn('krl-compiler', [], {
    cwd: path.resolve(__dirname, '../node_modules/krl-compiler/bin')//this seems a bit hacky
  });

  var err_msg = '';
  proc.stderr.on('data', function(data){
    err_msg += data;
  });
  proc.on('close', function(code){
    if(code === 0){
      return callback();//all is well
    }
    callback(new Error('Failed to compile: ' + err_msg));
  });

  proc.stdout.pipe(out);
  src.pipe(proc.stdin);
};

module.exports = function(rulesets_dir, src, callback){
  src = src + ' ';
  var shasum = crypto.createHash('sha256');
  shasum.update(src);
  var hash = shasum.digest('hex');
  var hash_path = path.join(
    rulesets_dir,
    hash.substr(0, 2),
    hash.substr(2, 2),
    hash
  );
  var krl_path = hash_path + '.krl';
  var js_path = hash_path + '.js';
  fsExist(krl_path, function(err, does_exist){
    if(err) return callback(err);
    if(does_exist){
      compileFile(krl_path, js_path, callback);
      return;
    }
    storeFile(krl_path, src, function(err){
      if(err) return callback(err);
      compileFile(krl_path, js_path, callback);
    });
  });
};
