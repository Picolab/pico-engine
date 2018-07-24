var _ = require("lodash");
var async = require("async");

module.exports = function(worker){

    var pico_queues = {};

    var getQ = function(pico_id){
        if(!_.has(pico_queues, pico_id)){
            var q = async.queue(function(job, done){
                job = JSON.parse(job);
                worker(pico_id, job.type, job.data)
                    .then(function(val){
                        done(null, val);
                    })
                    .catch(function(err){
                        process.nextTick(function(){
                            //wrapping in nextTick resolves strange issues with UnhandledPromiseRejectionWarning
                            //when infact we are handling the rejection
                            done(err);
                        });
                    });
            });
            pico_queues[pico_id] = q;
        }
        return pico_queues[pico_id];
    };

    return {
        enqueue: function(pico_id, type, data, callback){
            getQ(pico_id).push(JSON.stringify({
                type: type,
                data: data,
            }), callback);
        }
    };
};
