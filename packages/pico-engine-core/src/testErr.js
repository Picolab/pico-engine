module.exports = function(t, module){
    return function*(fn_name, ctx, args, error, message){
        try{
            yield module[fn_name](ctx, args);
            t.fail("Failed to throw an error");
        }catch(err){
            t.equals(err + "", error, message);
        }
    };
};