var _ = require('lodash');

var gen_by_type = {
  'String': function(ast, ind, gen){
    return JSON.stringify(ast.value);
  },
  'Identifier': function(ast, ind, gen){
    return ast.value;
  },
  'Keyword': function(ast, ind, gen){
    return ast.value;
  },
  'Chevron': function(ast, ind, gen){
    return '<<' + _.map(ast.value, function(v){
      return v.type === 'String'
        ? v.value.replace(/>>/g, '>\\>')
        : '#{' + gen(v) + '}';
    }).join('') + '>>';
  },
  'RegExp': function(ast, ind, gen){
    var r = ast.value;
    return 're#' + r.source + '#'
      + (r.global ? 'g' : '')
      + (r.ignoreCase ? 'i' : '');
  },
  'InfixOperator': function(ast, ind, gen){
    return gen(ast.left) + ' ' + ast.op + ' ' + gen(ast.right);
  },
  'Function': function(ast, ind, gen){
    return 'function(' + gen(ast.params) + '){\n' + _.map(ast.body, function(stmt){
      return gen(stmt, 1);
    }).join(';\n') + '\n' + ind() + '}';
  },
  'ExpressionStatement': function(ast, ind, gen){
    return ind() + gen(ast.expression);
  },
  'Declaration': function(ast, ind, gen){
    return ind() + gen(ast.left) + ' ' + ast.op + ' ' + gen(ast.right);
  },
  'Ruleset': function(ast, ind, gen){
    var src = '';
    src += ind() + 'ruleset ' + gen(ast.name) + ' {\n';
    if(!_.isEmpty(ast.meta)){
      src += ind(1) + 'meta {\n';
      src += gen(ast.meta, 2) + '\n';
      src += ind(1) + '}\n';
    }
    if(!_.isEmpty(ast.global)){
      src += ind(1) + 'global {\n';
      src += gen(ast.global, 2) + '\n';
      src += ind(1) + '}\n';
    }
    src += gen(ast.rules, 1) + '\n';
    src += ind() + '}';
    return src;
  },
  'RulesetMetaProperty': function(ast, ind, gen){
    return ind() + gen(ast.key) + ' ' + gen(ast.value);
  },
  'Rule': function(ast, ind, gen){
    var src = '';
    src += ind() + 'rule ' + gen(ast.name) + ' {\n';
    if(ast.select_when){
      var select_when = gen(ast.select_when);
      if(/\)/.test(select_when)){
        select_when += ';';
      }
      src += ind(1) + 'select when ' + select_when + '\n';
    }
    src += gen(ast.action_block, 1) + '\n';
    src += ind() + '}';
    return src;
  },
  'EventExpression': function(ast, ind, gen){
    var src = '';
    src += gen(ast.event_domain) + ' ' + gen(ast.event_type);
    if(!_.isEmpty(ast.attributes)){
      src += ' ' + _.map(ast.attributes, function(a){
        return gen(a, 1);
      }).join(' ');
    }
    if(!_.isEmpty(ast.setting)){
      src += ' setting(' + _.map(ast.setting, function(a){
        return gen(a, 1);
      }).join(', ') + ')';
    }
    return src;
  },
  'AttributeMatch': function(ast, ind, gen){
    return gen(ast.key) + ' ' + gen(ast.value);
  },
  'EventOperator': function(ast, ind, gen){
    return _.map(ast.args, function(arg){
      return gen(arg, 1);
    }).join(' ' + ast.op + ' ');
  },
  'RuleActionBlock': function(ast, ind, gen){
    var src = '';
    src += gen(ast.actions);
    return src;
  },
  'RuleAction': function(ast, ind, gen){
    var src = '';
    src += ind() + gen(ast.action) + '(' + gen(ast.args) + ')';
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
