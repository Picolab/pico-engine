require("codemirror/lib/codemirror.css");
require("codemirror/addon/edit/matchbrackets");
var CodeMirror = require("codemirror/lib/codemirror");

require("codemirror/addon/mode/simple");
require("./mode")(CodeMirror);

window.KRL_EDITOR = function(el){
    var editor = CodeMirror.fromTextArea(el, {
        mode: "text/x-krl",
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 4,
    });
};
