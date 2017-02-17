module.exports = function(e, body, loc){
    return e("call", e("id", "ctx.KRLClosure", loc), [
        e("id", "ctx", loc),
        e("fn", ["ctx"], body, loc)
    ], loc);
};
