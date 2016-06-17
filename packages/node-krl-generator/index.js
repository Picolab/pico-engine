var _ = require('lodash');

var gen_by_type = {
  'String': function(ast, ind, gen){
    return JSON.stringify(ast.value);
  },
  'Identifier': function(ast, ind, gen){
    return ast.value;
  },
  'Ruleset': function(ast, ind, gen){
    var src = '';
    src += ind() + 'ruleset ' + gen(ast.name) + ' {\n';
    src += gen(ast.rules, 1) + '\n';
    src += ind() + '}';
    return src;
  },
  'Assignment': function(ast, ind, gen){
    return ind() + gen(ast.left) + ' ' + ast.op + ' ' + gen(ast.right);
  },
  'Rule': function(ast, ind, gen){
    var src = '';
    src += ind() + 'rule ' + gen(ast.name) + ' {\n';
    src += ind(1) + 'select when ' + gen(ast.select_when) + '\n';
    src += gen(ast.action_block, 1) + '\n';
    src += ind() + '}';
    return src;
  },
  'EventExpression': function(ast, ind, gen){
    return gen(ast.event_domain) + ' ' + gen(ast.event_type);
  },
  'RuleActionBlock': function(ast, ind, gen){
    var src = '';
    src += gen(ast.actions);
    return src;
  },
  'RuleAction': function(ast, ind, gen){
    var src = '';
    src += ind() + gen(ast.callee) + '(' + gen(ast.args) + ')';
    if(!_.isEmpty(ast['with'])){
      src += ' with\n' + gen(ast['with'], 1);
    }
    return src;
  }
};

module.exports = function(ast, options){
  options = options || {};
  var indent_str = _.isString(options.indent) ? options.indent : '  ';

  var generate = function generate(ast, indent_level){
    indent_level = indent_level || 0;
    if(!ast){
      return '';
    }
    if(_.isArray(ast)){
      return _.map(ast, function(a){
        return generate(a, indent_level);
      }).join('\n');
    }
    if(_.has(gen_by_type, ast.type)){
      var ind = function(n){
        return _.repeat(indent_str, indent_level + (n || 0));
      };
      var gen = function(ast, increase_indent_by){
        increase_indent_by = _.parseInt(increase_indent_by, 10) || 0;
        return generate(ast, indent_level + increase_indent_by);
      };
      return gen_by_type[ast.type](ast, ind, gen);
    }
    throw new Error('Unsupported ast node type: ' + ast.type);
  };

  return generate(ast, 0);
};
