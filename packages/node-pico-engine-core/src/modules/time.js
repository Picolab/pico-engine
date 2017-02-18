module.exports = {
    def: {
        now: function(ctx, args){
            return (new Date()).toISOString();
        }
    }
};
