var _ = require("lodash");
var phonetic = new require("phonetic");
var default_grammar = new require("../src/grammar.js");

var gen = {
    "RulesetID": function(){
        return "karl42.picolabs.io";
    },
    "Identifier": function(){
        return phonetic.generate();
    },
    "Keyword": function(){
        return phonetic.generate();
    },
    "String": function(){
        return JSON.stringify(phonetic.generate());
    },
    "Chevron": function(){
        return "<<blah>>";
    },
    "RegExp": function(){
        return "re#(.*)#";
    },
    "Number": function(){
        return _.random(-100, 100, true) + "";
    },
    "PositiveInteger": function(){
        return _.random(0, 100) + "";
    },


    "Expression": function(){//TODO remove
        return "\"expression\"";//TODO remove
    },//TODO remove
};

var isParenRule = function(rule){
    if(_.size(rule && rule.symbols) !== 3){
        return false;
    }
    var s = rule.symbols;
    if(!s[0] || s[0].unparse_hint_value !== "("){
        return false;
    }
    if(s[1] !== "Expression"){
        return false;
    }
    if(!s[2] || s[2].unparse_hint_value !== ")"){
        return false;
    }
    return true;
};

module.exports = function(options){
    options = options || {};

    var grammar = options.grammar || default_grammar;
    var start = options.start || grammar.ParserStart;

    var stack = [start];
    var output = "";
    var stop_recusive_rules = false;

    var selectRule = function(currentname){
        var rules = grammar.ParserRules.filter(function(x) {
            return x.name === currentname;
        });
        if(rules.length === 0){
            throw new Error("Nothing matches rule: "+currentname+"!");
        }
        return _.sample(_.filter(rules, function(rule){
            if(isParenRule(rule)){
                return false;
            }
            if(stop_recusive_rules || stack.length > 25){
                return !_.includes(rule.symbols, currentname);
            }
            return true;
        }));
    };

    var count = 0;

    while(stack.length > 0){
        count++;
        if(!stop_recusive_rules && count > 500){
            stop_recusive_rules = true;
        }
        var currentname = stack.pop();
        if(/^With_/.test(currentname)){
            currentname = "With_and_body";
        }
        if(currentname === "left_side_of_declaration"){
            currentname = "Identifier";
        }
        if(gen[currentname]){
            stack.push({literal: gen[currentname]()});
        }else if(typeof currentname === "string"){
            _.each(selectRule(currentname).symbols, function(symbol){
                stack.push(symbol);
            });

        }else if(currentname.unparse_hint_value){
            output = " " + currentname.unparse_hint_value + " " + output;
        }else if(_.has(currentname, "unparse_hint_enum")){
            output = " " + _.sample(currentname.unparse_hint_enum) + " " + output;
        }else if(currentname.unparse_hint_type === "SYMBOL"){
            output = " " + phonetic.generate() + " " + output;
        }else if(currentname.literal){
            output = currentname.literal + " " + output;
        }else{
            throw new Error("Unsupported: " + JSON.stringify(currentname));
        }
    }

    return output;
};
