module.exports = function(t, module){
    return async function(fnName, ctx, args, error, message){
        try{
            await module[fnName](ctx, args);
            t.fail("Failed to throw an error");
        }catch(err){
            t.equals(err + "", error, message);
        }
    };
};
