var _ = require('lodash');
var λ = require('contra');
var fs = require('fs');
var path = require('path');
var parser = require('krl-parser');
var JsDiff = require('diff');
var generator = require('./');
var commentsRegExp = require('krl-parser/src/commentsRegExp');

var files_dir = path.resolve(__dirname, './test-files');

var diff = function(out, expected){
  var diffs = JsDiff.diffLines(expected, out, {ignoreWhitespace: false});

  return _.flattenDeep(_.map(diffs, function(d){
    var mod = d.removed && d.added ? '!' : (d.removed ? '-' : (d.added ? '+' : ' '));
    var lines = d.value.split('\n');
    if(lines.length > 0 && lines[lines.length - 1] === ''){
      lines = lines.slice(0, lines.length - 1);
    }
    return _.map(lines, function(line){
      return mod + ' ' + line;
    });
  })).join('\n');
};

var allDone = function(err){
  if(err){
    console.error('FAILED! ' + err);
    process.exit(1);
  }else{
    console.log('PASSED!');
  }
};

console.log('');
console.log('Starting tests...');
fs.readdir(files_dir, function(err, files){
  if(err) return allDone(err);
  λ.each.series(files, function(file, next){
    fs.readFile(path.resolve(files_dir, file), 'utf-8', function(err, src){
      if(err) return next(err);

      console.log('testing: ' + path.basename(file));

      var out = generator(parser(src, {filename: file}));
      var expected = src.replace(commentsRegExp, '').trim();

      if(out === expected){
        console.log('  ...passed');
        next();
      }else{
        console.log('');
        console.log(diff(out, expected));
        console.log('');
        next(new Error('see diff'));
      }
    });
  }, allDone);
});
