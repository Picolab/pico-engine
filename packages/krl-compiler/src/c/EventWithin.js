var _ = require("lodash");

var time_period_in_ms = {
    second: 1000,
    minute: 1000 * 60,
    hour  : 1000 * 60 * 60,
    day   : 1000 * 60 * 60 * 24,
    week  : 1000 * 60 * 60 * 24 * 7,
    month : 1000 * 60 * 60 * 24 * 30,
    year  : 1000 * 60 * 60 * 24 * 365,
};

module.exports = function(ast, comp, e){
    var multiplier = 1;
    if(_.has(time_period_in_ms, ast.time_period)){
        multiplier = time_period_in_ms[ast.time_period];
    }else{
        var key = ast.time_period.replace(/s$/i, "");
        if(_.has(time_period_in_ms, key)){
            multiplier = time_period_in_ms[key];
        }
    }
    return e("genfn", ["ctx"], [
        e("return", e("*", comp(ast.expression), e("num", multiplier)))
    ]);
};
