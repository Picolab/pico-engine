require("codemirror/lib/codemirror.css");
var CodeMirror = require("codemirror/lib/codemirror");


window.KRL_EDITOR = function(el){
    var editor = CodeMirror.fromTextArea(el, {
        mode: 'text/x-krl',
        lineNumbers: true,
    });
};
