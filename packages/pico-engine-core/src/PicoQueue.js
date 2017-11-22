var _ = require("lodash");
var async = require("async");

module.exports = function(worker){

    var pico_queues = {};

    var getQ = function(pico_id){
        if(!_.has(pico_queues, pico_id)){
            var q = async.queue(function(job, done){
                // console.log("QUEING");
                // console.log("QUEING");
                // console.log("QUEING");
                // console.log(job);
                worker(pico_id, JSON.parse(job), done);
            });
            pico_queues[pico_id] = q;
        }
        return pico_queues[pico_id];
    };

    return {
        enqueue: function(pico_id, job, callback){
            // console.log("ENQUEING");
            // console.log("ENQUEING");
            // console.log("ENQUEING");
            // console.log("ENQUEING");
            // console.log("ENQUEING");
            // console.log("ENQUEING");
            // console.log(job);
            getQ(pico_id).push(JSON.stringify(job), callback);
        }
    };
};
