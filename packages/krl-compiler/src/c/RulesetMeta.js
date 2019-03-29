var _ = require('lodash')

var propTypes = {
  'name': function (props, comp, e) {
    if (_.size(props) !== 1) {
      throw new Error('only 1 meta.name allowed')
    }
    return comp(_.head(props).value)
  },
  'description': function (props, comp, e) {
    if (_.size(props) !== 1) {
      throw new Error('only 1 meta.description allowed')
    }
    return comp(_.head(props).value)
  },
  'author': function (props, comp, e) {
    if (_.size(props) !== 1) {
      throw new Error('only 1 meta.author allowed')
    }
    return comp(_.head(props).value)
  },
  'use': function (props, comp, e) {
    return e('arr', _.map(props, function (prop) {
      var ast = prop.value
      var obj = {
        kind: e('str', ast.kind, ast.loc),
        rid: e('str', ast.rid.value, ast.rid.loc),
        alias: ast.alias
          ? e('str', ast.alias.value, ast.alias.loc)
          : e('str', ast.rid.value, ast.rid.loc)
      }
      if (ast.version) {
        obj.version = comp(ast.version)
      }
      if (ast['with']) {
        obj['with'] = e('asyncfn', ['ctx'], comp(ast['with']), ast['with'].loc)
      }
      return e('obj', obj, ast.loc)
    }))
  },
  'configure': function (props, comp, e) {
    if (_.size(props) !== 1) {
      throw new Error('only 1 meta.configure allowed')
    }
    var ast = _.head(props)
    return e('asyncfn', ['ctx'], comp(ast.value.declarations), ast.value.loc)
  },
  'shares': function (props, comp, e) {
    var ids = _.uniqBy(_.flatten(_.map(props, 'value.ids')), 'value')
    return e('arr', _.map(ids, function (id) {
      return e('str', id.value, id.loc)
    }))
  }
}

module.exports = function (ast, comp, e) {
  return e('obj', _.mapValues(_.groupBy(ast.properties, function (p) {
    if (p.type !== 'RulesetMetaProperty') {
      throw new Error('RulesetMeta.properties should all be RulesetMetaProperty ast nodes')
    }
    if (p.key.type !== 'Keyword') {
      throw new Error('RulesetMetaProperty.key should a Keyword')
    }
    if (_.has(p.value, 'operator')) {
      if (p.value.operator.type !== 'Keyword') {
        throw new Error('RulesetMetaProperty.operator should a Keyword')
      }
      return p.key.value + '_' + p.value.operator.value
    }
    return p.key.value
  }), function (props, key) {
    if (!_.has(propTypes, key)) {
      throw new Error('RulesetMetaProperty not supported: ' + key)
    }
    return propTypes[key](props, comp, e)
  }))
}
