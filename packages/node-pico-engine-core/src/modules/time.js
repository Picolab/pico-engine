var fns = {
    now: function(ctx, args){
        return (new Date()).toISOString();
    }
};

module.exports = {
    get: function(ctx, id){
        return fns[id];
    }
};
