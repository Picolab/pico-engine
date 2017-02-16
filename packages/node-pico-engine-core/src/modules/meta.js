var _ = require("lodash");

module.exports = {
    get: function(ctx,id){
        if(id === "eci"){
            return _.get(ctx,["event","eci"],_.get(ctx,["query","eci"]));
        }
    }
};
