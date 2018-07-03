var ace = require("brace");
require("brace/ext/searchbox");
require("./mode");

var themes_grouped = {
    bright: [
        "chrome",
        "clouds",
        "crimson_editor",
        "dawn",
        "dreamweaver",
        "eclipse",
        "github",
        "iplastic",
        "katzenmilch",
        "kuroir",
        "solarized_light",
        "sqlserver",
        "textmate",
        "tomorrow",
        "xcode",
    ],
    dark: [
        "ambiance",
        "chaos",
        "clouds_midnight",
        "cobalt",
        "dracula",
        "gob",
        "gruvbox",
        "idle_fingers",
        "kr_theme",
        "merbivore",
        "merbivore_soft",
        "mono_industrial",
        "monokai",
        "pastel_on_dark",
        "solarized_dark",
        "terminal",
        "tomorrow_night",
        "tomorrow_night_blue",
        "tomorrow_night_bright",
        "tomorrow_night_eighties",
        "twilight",
        "vibrant_ink",
    ],
};
var themes_index = {};
var picker_html = "";
Object.keys(themes_grouped).forEach(function(groupname){
    picker_html += "<optgroup label=\"" + groupname + "\">";
    themes_grouped[groupname].forEach(function(name){
        themes_index[name] = true;
        require("brace/theme/" + name);
        picker_html += "<option value=\"" + name + "\">" + name + "</option>";
    });
    picker_html += "</optgroup>";
});


var editors = [];

var selected_theme = "chrome";

var setTheme = function(theme){
    theme = themes_index[theme]
        ? theme
        : "chrome";

    selected_theme = theme;
    localStorage["KRL_EDITOR-theme"] = theme;

    editors.forEach(function(editor){
        editor.setTheme("ace/theme/" + theme);
    });
};

setTheme(localStorage["KRL_EDITOR-theme"]);

module.exports = window.KRL_EDITOR = {
    edit: function(css_id){
        var editor = ace.edit(css_id);
        editor.setTheme("ace/theme/" + selected_theme);
        editor.getSession().setMode("ace/mode/krl");
        editor.getSession().setTabSize(2);
        editor.getSession().setUseSoftTabs(true);

        editors.push(editor);

        return editor;
    },
    themePicker: function(css_id){
        var select = document.getElementById(css_id);
        select.innerHTML = picker_html;
        select.value = selected_theme;
        select.addEventListener("change", function(event){
            setTheme(select.value);
        });
    },
};
