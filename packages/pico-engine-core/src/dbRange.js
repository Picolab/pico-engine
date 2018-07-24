var _ = require("lodash");

module.exports = function(ldb, opts, onData, callbackOrig){
    var hasCalledback = false;
    var callback = function(){
        if(hasCalledback) return;
        hasCalledback = true;
        callbackOrig.apply(null, arguments);
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
