var _ = require('lodash')

var propTypes = {
  'version': function (props, comp, e) {
    if (_.size(props) > 1) {
      throw comp.error(props[1].loc, 'only 1 meta.version allowed')
    }
    return comp(_.head(props).value)
  },
  'name': function (props, comp, e) {
    if (_.size(props) > 1) {
      throw comp.error(props[1].loc, 'only 1 meta.name allowed')
    }
    return comp(_.head(props).value)
  },
  'description': function (props, comp, e) {
    if (_.size(props) > 1) {
      throw comp.error(props[1].loc, 'only 1 meta.description allowed')
    }
    return comp(_.head(props).value)
  },
  'author': function (props, comp, e) {
    if (_.size(props) > 1) {
      throw comp.error(props[1].loc, 'only 1 meta.author allowed')
    }
    return comp(_.head(props).value)
  },
  'logging': function (props, comp, e) {
    if (_.size(props) > 1) {
      throw comp.error(props[1].loc, 'only 1 meta.logging allowed')
    }
    const prop = _.head(props)
    comp.warn(prop.loc, 'DEPRECATED meta.logging is no longer needed, logging is always on')
    return comp(prop.value)
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
      if (ast['with']) {
        obj['with'] = e('arr', ast['with'].map(dec => {
          return e('str', dec.left.value, dec.left.loc)
        }))
      }
      return e('obj', obj, ast.loc)
    }))
  },
  'configure': function (props, comp, e) {
    const ids = []
    for (const ast of props) {
      for (const dec of ast.value.declarations) {
        ids.push(dec.left)
      }
    }
    return e('arr', _.map(ids, function (id) {
      return e('str', id.value, id.loc)
    }))
  },
  'shares': function (props, comp, e) {
    var ids = _.uniqBy(_.flatten(_.map(props, 'value.ids')), 'value')
    return e('arr', _.map(ids, function (id) {
      return e('str', id.value, id.loc)
    }))
  },
  'provides': function (props, comp, e) {
    var ids = _.uniqBy(_.flatten(_.map(props, 'value.ids')), 'value')
    return e('arr', _.map(ids, function (id) {
      return e('str', id.value, id.loc)
    }))
  }
}

module.exports = function (ast, comp, e) {
  return e('obj', _.mapValues(_.groupBy(ast.properties, function (p) {
    if (p.type !== 'RulesetMetaProperty') {
      throw comp.error(p.loc, 'RulesetMeta.properties should all be RulesetMetaProperty ast nodes')
    }
    if (p.key.type !== 'Keyword') {
      throw comp.error(p.key.loc, 'RulesetMetaProperty.key should a Keyword')
    }
    if (_.has(p.value, 'operator')) {
      if (p.value.operator.type !== 'Keyword') {
        throw comp.error(p.value.operator.loc, 'RulesetMetaProperty.operator should a Keyword')
      }
      return p.key.value + '_' + p.value.operator.value
    }
    return p.key.value
  }), function (props, key) {
    if (!_.has(propTypes, key)) {
      throw comp.error(props[0].loc, 'RulesetMetaProperty not supported: ' + key)
    }
    return propTypes[key](props, comp, e)
  }))
}
