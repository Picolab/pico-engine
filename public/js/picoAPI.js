window.picoAPI = function(url, params, httpMethod, callback){
    onSucceed = function(data){
        if(data && data.ok === true){
            callback(null, data);
        }else{
            var err = new Error((data.error || "unknown cause") + "");
            err.data = data;
            callback(err);
        }
    };
    onFail = function(ajax_err){
        var err;
        if(ajax_err && ajax_err.responseJSON && ajax_err.responseJSON.error){
            err = new Error(ajax_err.responseJSON.error);
            err.data = ajax_err.responseJSON;
        }else{
            err = new Error(ajax_err.status + " " + ajax_err.statusText);
            err.data = ajax_err;
        }
        callback(err);
    };
    if(httpMethod === "GET") {
        $.getJSON(url, params, onSucceed, "json").fail(onFail);
    } else {
        $.post(url, params, onSucceed, "json").fail(onFail);
    }
};
