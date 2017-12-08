var ace = require("brace");
require("brace/theme/xcode");

require("./mode2");

window.KRL_EDITOR = function(css_id){
    var editor = ace.edit(css_id);
    editor.getSession().setMode("ace/mode/krl");
    editor.setTheme("ace/theme/xcode");
};
