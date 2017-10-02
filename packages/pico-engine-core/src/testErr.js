module.exports = function(t, module){
    return function*(fn_name, ctx, args, type, message){
        try{
            yield module[fn_name](ctx, args);
            t.fail("Failed to throw an error");
        }catch(err){
            t.equals(err.name, type, message);
        }
    };
};