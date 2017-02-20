module.exports = function(e, domain, id, args, loc){
    return e("ycall",
        e("ycall",
            e("id", "ctx.modules.get", loc),
            [
                e("id", "ctx", loc),
                e("str", domain, loc),
                e("str", id, loc)
            ],
            loc
        ),
        [
            e("id", "ctx", loc),
            e("arr", args, loc)
        ],
        loc
    );
};
