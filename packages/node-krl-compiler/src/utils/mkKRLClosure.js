module.exports = function(e, body, loc){
    return e("ycall", e("id", "ctx.KRLClosure", loc), [
        e("id", "ctx", loc),
        e("genfn", ["ctx"], body, loc)
    ], loc);
};
