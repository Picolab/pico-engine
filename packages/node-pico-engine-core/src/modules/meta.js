var _ = require("lodash");

module.exports = {
    get: function(ctx, id, callback){
        if(id === "eci"){
            callback(null, _.get(ctx,["event","eci"],_.get(ctx,["query","eci"])));
            return;
        }
        callback(new Error("Meta attribute not defined `" + id + "`"));
    }
};
