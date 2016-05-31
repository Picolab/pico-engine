var _ = require('lodash');
var λ = require('contra');
var fs = require('fs');
var path = require('path');
var test = require('tape');
var compiler = require('./');

var files_dir = './test-files';

test('compiler', function(t){
  fs.readdir(files_dir, function(err, files){
    if(err) return t.end(err);

    var basenames = _.uniq(_.map(files, function(file){
      return path.basename(path.basename(file, '.krl'), '.js');
    }));

    λ.each(basenames, function(basename, next){
      var f_js = path.join(files_dir, basename) + '.js';
      var f_krl = path.join(files_dir, basename) + '.krl';
      λ.concurrent({
        js: λ.curry(fs.readFile, f_js, 'utf-8'),
        krl: λ.curry(fs.readFile, f_krl, 'utf-8')
      }, function(err, srcs){
        if(err) return t.end(err);

        var compiled;
        try{
          compiled = compiler(srcs.krl);
        }catch(e){
          compiled = e + '';
        }
        compiled = compiled.trim();
        var expected = srcs.js.trim();

        t.equals(compiled, expected);

        next();
      });
    }, t.end);
  });
});
