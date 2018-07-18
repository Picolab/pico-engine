module.exports = function(t, module){
    return async function(fn_name, ctx, args, error, message){
        try{
            await module[fn_name](ctx, args);
            t.fail("Failed to throw an error");
        }catch(err){
            t.equals(err + "", error, message);
        }
    };
};
