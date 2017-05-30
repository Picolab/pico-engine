module.exports = function(e, domain, id, args, loc){
    var module_val = e("ycall",
        e("id", "ctx.modules.get", loc),
        [
            e("id", "ctx", loc),
            e("str", domain, loc),
            e("str", id, loc)
        ],
        loc
    );
    return e("ycall", e("id", "ctx.applyFn"), [
        module_val,
        e("id", "ctx", loc),
        args
    ], loc);
};
