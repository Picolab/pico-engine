var ace = require("brace");
require("brace/theme/xcode");

require("./mode");

window.KRL_EDITOR = function(css_id){
    var editor = ace.edit(css_id);
    editor.setTheme("ace/theme/xcode");
    editor.getSession().setMode("ace/mode/krl");
    editor.getSession().setTabSize(2);
    editor.getSession().setUseSoftTabs(true);
};
