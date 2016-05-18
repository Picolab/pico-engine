var DB = require('./DB');

module.exports = function(conf){
  var db = DB({
    path: conf.db_path
  });

  return {
    db: db//TODO don't expose this
  };
};
