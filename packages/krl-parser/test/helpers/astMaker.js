// do NOT use if v is/has a chevron
var mk = function(v) {
  if (typeof v === "number") {
    return { type: "Number", value: v };
  } else if (v === true || v === false) {
    return { type: "Boolean", value: v };
  } else if (typeof v === "string") {
    return { type: "String", value: v };
  } else if (Array.isArray(v)) {
    return { type: "Array", value: v.map(mk) };
  } else if (v instanceof RegExp) {
    return { type: "RegExp", value: v };
  } else if (Object.prototype.toString.call(v) === "[object Object]") {
    return {
      type: "Map",
      value: Object.keys(v).map(function(key) {
        return {
          type: "MapKeyValuePair",
          key: { type: "String", value: key },
          value: v[key]
        };
      })
    };
  }
  return v;
};
mk.id = function(value) {
  return { type: "Identifier", value: value };
};
mk.dID = function(domain, value) {
  return { type: "DomainIdentifier", value: value, domain: domain };
};
mk.get = function(object, property, method) {
  return {
    type: "MemberExpression",
    object: object,
    property: property,
    method: method || "dot"
  };
};
mk.arg = function(id, val) {
  return {
    type: "NamedArgument",
    id: mk.id(id),
    value: val
  };
};
mk.args = function(args) {
  return {
    type: "Arguments",
    args: args || []
  };
};
mk.app = function(callee, args) {
  return {
    type: "Application",
    callee: callee,
    args: mk.args(args)
  };
};
mk.action = function(lbl, id, args, setting) {
  return {
    type: "Action",
    label: lbl ? mk.id(lbl) : null,
    action: mk.id(id),
    args: mk.args(args),
    setting: setting || []
  };
};
mk.key = function(value) {
  return { type: "Keyword", value: value };
};
mk.op = function(op, left, right) {
  return {
    type: "InfixOperator",
    op: op,
    left: left,
    right: right
  };
};
mk.unary = function(op, arg) {
  return {
    type: "UnaryOperator",
    op: op,
    arg: arg
  };
};
mk.ee = function(domain, type, attrs, setting, where, aggregator) {
  return {
    type: "EventExpression",
    event_domain: mk.id(domain),
    event_type: mk.id(type),
    event_attrs: attrs || [],
    setting: setting ? setting.map(mk.id) : [],
    where: where || null,
    aggregator: aggregator || null
  };
};
mk.eventOp = function(op, args) {
  return {
    type: "EventOperator",
    op: op,
    args: args
  };
};
mk.eventGroupOp = function(op, n, event) {
  return {
    type: "EventGroupOperator",
    op: op,
    n: n,
    event: event
  };
};
mk.declare = function(op, left, right) {
  return { type: "Declaration", op: op, left: left, right: right };
};
mk.meta = function(key, value) {
  return {
    type: "RulesetMetaProperty",
    key: mk.key(key),
    value: value
  };
};
mk.param = function(id, dflt) {
  return {
    type: "Parameter",
    id: mk.id(id),
    default: dflt || null
  };
};
mk.params = function(params) {
  return {
    type: "Parameters",
    params: params.map(function(param) {
      if (typeof param === "string") {
        return mk.param(param);
      }
      return param;
    })
  };
};

module.exports = mk;
