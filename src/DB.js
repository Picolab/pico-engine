var _ = require('lodash');
var λ = require('contra');
var levelup = require('levelup');
var bytewise = require('bytewise');

var dbToObj = function(ldb, callback){
  var db_data = {};
  ldb.createReadStream()
    .on('data', function(data){
      if(!_.isArray(data.key)){
        return;
      }
      _.set(db_data, data.key, data.value);
    })
    .on('end', function(){
      callback(undefined, db_data);
    });
};

module.exports = function(opts){

  var ldb = levelup(opts.path, {
    keyEncoding: bytewise,
    valueEncoding: 'json'
  });

  return {
    dbToObj: function(callback){
      dbToObj(ldb, callback);
    },
    put: function(key, val, callback){
      ldb.put(key, val, callback);
    },
    del: function(key, callback){
      ldb.del(key, callback);
    },
    getPicoByECI: function(eci, callback){
      var db_data = {};
      ldb.createReadStream()
        .on('data', function(data){
          if(!_.isArray(data.key)){
            return;
          }
          _.set(db_data, data.key, data.value);
        })
      .on('end', function(){
        var da_pico = undefined;
        _.each(db_data.pico, function(pico, pico_id){
          if(_.has(pico.channel, eci)){
            da_pico = pico;
          }
        });
        callback(undefined, da_pico);
      });
    }
  };
};
