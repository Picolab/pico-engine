var _ = require("lodash");
var λ = require("contra");

module.exports = function(worker){

  var pico_queues = {};

  var getQ = function(pico_id){
    if(!_.has(pico_queues, pico_id)){
      var q = λ.queue(function(job, done){
        worker(pico_id, job, done);
      });
      pico_queues[pico_id] = q;
    }
    return pico_queues[pico_id];
  };

  return {
    enqueue: function(pico_id, job, callback){
      getQ(pico_id).unshift(JSON.stringify(job), callback);
    }
  };
};
