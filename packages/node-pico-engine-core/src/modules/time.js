module.exports = function(core){
    return {
        def: {
            now: function*(ctx, args){
                return (new Date()).toISOString();
            }
        }
    };
};
