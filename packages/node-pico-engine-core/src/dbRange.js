var _ = require("lodash");

module.exports = function(ldb, opts, onData, callback_orig){
    var has_calledback = false;
    var callback = function(){
        if(has_calledback) return;
        has_calledback = true;
        callback_orig.apply(this, arguments);
    };

    if(_.has(opts, "prefix")){
        opts = _.assign({}, opts, {
            gte: opts.prefix,
            lte: opts.prefix.concat([undefined])//bytewise sorts with null at the bottom and undefined at the top
        });
        delete opts.prefix;
    }
    var s = ldb.createReadStream(opts);
    var stopRange = function(){
        s.destroy();
        callback();
    };
    s.on("error", function(err){
        callback(err);
    });
    s.on("end", callback);
    s.on("data", function(data){
        onData(data, stopRange);
    });
};
