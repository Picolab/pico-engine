import * as _ from "lodash";
import { asyncSort } from "./asyncSort";
import * as krl from "./krl";

function ltEqGt(left: any, right: any): 0 | 1 | -1 {
  let a: any = krl.toNumberOrNull(left);
  let b: any = krl.toNumberOrNull(right);
  if (a === null || b === null) {
    // fall back on string comparison
    a = krl.toString(left);
    b = krl.toString(right);
  }
  // at this point a and b are both numbers or both strings
  return a === b ? 0 : a > b ? 1 : -1;
}

function sprintfBase(val: any, template: string, specifier: string) {
  return _.join(
    _.map(template.split(/\\\\/g), function (v) {
      return v.replace(
        new RegExp("(^|[^\\\\])" + specifier, "g"),
        "$1" + val + ""
      );
    }),
    "\\"
  ).replace(new RegExp("\\\\" + specifier, "g"), specifier);
}

async function iterBase(
  val: any,
  iter: (item: any, key: any, obj: any) => boolean | Promise<boolean>
) {
  if (!krl.isArrayOrMap(val)) {
    throw new TypeError("only works on collections");
  }
  var shouldContinue;
  if (krl.isArray(val)) {
    var i;
    for (i = 0; i < val.length; i++) {
      shouldContinue = await iter(val[i], i, val);
      if (!shouldContinue) break;
    }
  } else {
    var key;
    for (key in val) {
      if (_.has(val, key)) {
        shouldContinue = await iter(val[key], key, val);
        if (!shouldContinue) break;
      }
    }
  }
}

const identity = krl.Function(["val"], function (val) {
  return val;
});

// coerce the value into an array of key strings
function toKeyPath(path: any) {
  if (!krl.isArray(path)) {
    path = [path];
  }
  return _.map(path, krl.toString);
}

function isSafeArrayIndex(arr: any[], key: any) {
  var index = _.parseInt(key, 10);
  if (_.isNaN(index)) {
    return false;
  }
  return index >= 0 && index <= arr.length; // equal too b/c it's ok to append
}

const stdlib: krl.Module = {
  /////////////////////////////////////////////////////////////////////////////
  // Infix operators
  "+": krl.Function(["left", "right"], function (left, right) {
    if (arguments.length < 2) {
      return left;
    }
    // if we have two "numbers" then do plus
    if (krl.isNumber(left) && krl.isNumber(right)) {
      return left + right;
    }
    // else do concat
    return krl.toString(left) + krl.toString(right);
  }),

  "-": krl.Function(["left", "right"], function (left, right) {
    const leftNumber = krl.toNumberOrNull(left);
    if (arguments.length < 2) {
      if (leftNumber === null) {
        throw new TypeError("Cannot negate " + krl.toString(left));
      }
      return -leftNumber;
    }
    const rightNumber = krl.toNumberOrNull(right);
    if (leftNumber === null || rightNumber === null) {
      throw new TypeError(
        krl.toString(right) + " cannot be subtracted from " + krl.toString(left)
      );
    }
    return leftNumber - rightNumber;
  }),

  "*": krl.Function(["left", "right"], function (left, right) {
    const leftNumber = krl.toNumberOrNull(left);
    const rightNumber = krl.toNumberOrNull(right);
    if (leftNumber === null || rightNumber === null) {
      throw new TypeError(
        krl.toString(left) + " cannot be multiplied by " + krl.toString(right)
      );
    }
    return leftNumber * rightNumber;
  }),

  "/": krl.Function(["left", "right"], function (left, right) {
    const leftNumber = krl.toNumberOrNull(left);
    const rightNumber = krl.toNumberOrNull(right);
    if (leftNumber === null || rightNumber === null) {
      throw new TypeError(
        krl.toString(left) + " cannot be divided by " + krl.toString(right)
      );
    }
    if (rightNumber === 0) {
      this.log.debug("[DIVISION BY ZERO] " + leftNumber + " / 0");
      return 0;
    }
    return leftNumber / rightNumber;
  }),

  "%": krl.Function(["left", "right"], function (left, right) {
    const leftNumber = krl.toNumberOrNull(left);
    const rightNumber = krl.toNumberOrNull(right);
    if (leftNumber === null || rightNumber === null) {
      throw new TypeError(
        "Cannot calculate " +
          krl.toString(left) +
          " modulo " +
          krl.toString(right)
      );
    }
    if (rightNumber === 0) {
      return 0;
    }
    return leftNumber % rightNumber;
  }),

  "==": krl.Function(["left", "right"], function (left, right) {
    return krl.isEqual(left, right);
  }),
  "!=": krl.Function(["left", "right"], function (left, right) {
    return !krl.isEqual(left, right);
  }),

  "<=>": krl.Function(["left", "right"], function (left, right) {
    return ltEqGt(left, right);
  }),
  "<": krl.Function(["left", "right"], function (left, right) {
    return ltEqGt(left, right) < 0;
  }),
  ">": krl.Function(["left", "right"], function (left, right) {
    return ltEqGt(left, right) > 0;
  }),
  "<=": krl.Function(["left", "right"], function (left, right) {
    return ltEqGt(left, right) <= 0;
  }),
  ">=": krl.Function(["left", "right"], function (left, right) {
    return ltEqGt(left, right) >= 0;
  }),

  "><": krl.Function(["left", "right"], function (left, right): boolean {
    if (krl.isArray(left)) {
      return _.findIndex(left, _.partial(krl.isEqual, right)) >= 0;
    } else if (krl.isMap(left)) {
      return _.has(left, right);
    }
    throw new TypeError(">< only works with Array or Map");
  }),

  like: krl.Function(["val", "regex"], function (val, regex): boolean {
    if (!krl.isRegExp(regex)) {
      regex = new RegExp(krl.toString(regex));
    }
    return regex.test(krl.toString(val));
  }),

  cmp: krl.Function(["left", "right"], function (left, right): -1 | 0 | 1 {
    left = krl.toString(left);
    right = krl.toString(right);
    return left === right ? 0 : left > right ? 1 : -1;
  }),

  /////////////////////////////////////////////////////////////////////////////

  as: krl.Function(["val", "type"], function (val, type) {
    if (arguments.length < 2) {
      return val;
    }
    const valType = krl.typeOf(val);
    if (valType === type) {
      return val;
    }
    if (type === "Boolean") {
      if (val === "false") {
        return false;
      }
      if (valType === "Number") {
        return val !== 0;
      }
      return !!val;
    }
    if (type === "String") {
      return krl.toString(val);
    }
    if (type === "Number") {
      return krl.toNumberOrNull(val);
    }
    if (type === "RegExp") {
      let regexSrc = krl.toString(val);
      if (valType !== "String" && /^\[[a-z]+\]$/i.test(regexSrc)) {
        regexSrc = regexSrc.replace(/^\[/, "\\[").replace(/\]$/, "\\]");
      }
      return new RegExp(regexSrc);
    }
    throw new TypeError(
      'Cannot use the .as("' +
        type +
        '") operator with ' +
        krl.toString(val) +
        " (type " +
        valType +
        ")"
    );
  }),

  isnull: krl.Function(["val"], function (val) {
    return krl.isNull(val);
  }),
  typeof: krl.Function(["val"], function (val) {
    return krl.typeOf(val);
  }),

  klog: krl.Function(["val", "message"], function (val, message) {
    this.log.klog(krl.isNull(message) ? "klog" : krl.toString(message), {
      val,
    });
    return val;
  }),

  sprintf: krl.Function(["val", "template"], function (val, template) {
    if (krl.isNull(template)) {
      return "";
    }
    template = krl.toString(template);
    if (krl.isNumber(val)) {
      return sprintfBase(val, template, "%d");
    }
    if (krl.isString(val)) {
      return sprintfBase(val, template, "%s");
    }
    return template;
  }),

  /////////////////////////////////////////////////////////////////////////////
  defaultsTo: krl.Function(["val", "defaultVal", "message"], function (
    val,
    defaultVal,
    message
  ) {
    if (!krl.isNull(val)) {
      return val; // not important whether defaultVal is missing
    }
    if (!krl.isNull(message)) {
      this.log.debug(`[DEFAULTSTO] ${krl.toString(message)}`);
    }
    return defaultVal;
  }),

  /////////////////////////////////////////////////////////////////////////////
  // Number operators
  chr: krl.Function(["val"], function (val) {
    const code = krl.toNumberOrNull(val);
    if (code === null) {
      return null;
    }
    return String.fromCharCode(code);
  }),

  range: krl.Function(["val", "end"], function (val, end) {
    if (arguments.length < 2) {
      return [];
    }
    const startNumber = krl.toNumberOrNull(val);
    const endNumber = krl.toNumberOrNull(end);
    if (startNumber === null || endNumber === null) {
      return [];
    }
    if (startNumber < endNumber) {
      return _.range(startNumber, endNumber + 1);
    }
    return _.range(startNumber, endNumber - 1);
  }),

  /////////////////////////////////////////////////////////////////////////////
  // Number operators
  capitalize: krl.Function(["val"], function (val) {
    val = krl.toString(val);
    if (val.length === 0) {
      return "";
    }
    return val[0].toUpperCase() + val.slice(1);
  }),

  decode: krl.Function(["val"], function (val) {
    return krl.decode(val);
  }),

  extract: krl.Function(["val", "regex"], function (val, regex) {
    if (arguments.length < 2) {
      return [];
    }
    val = krl.toString(val);
    if (!krl.isRegExp(regex)) {
      regex = new RegExp(krl.toString(regex));
    }
    var r = val.match(regex);
    if (!r) {
      return [];
    }
    if (regex.global) {
      return r;
    }
    return r.slice(1);
  }),

  lc: krl.Function(["val"], function (val) {
    return krl.toString(val).toLowerCase();
  }),
  uc: krl.Function(["val"], function (val) {
    return krl.toString(val).toUpperCase();
  }),

  match: krl.Function(["val", "regex"], function (val, regex) {
    if (krl.isString(regex)) {
      regex = new RegExp(regex);
    } else if (!krl.isRegExp(regex)) {
      return false;
    }
    return regex.test(krl.toString(val));
  }),

  ord: krl.Function(["val"], function (val) {
    val = krl.toString(val);
    var code = val.charCodeAt(0);
    return _.isNaN(code) ? null : code;
  }),

  split: krl.Function(["val", "splitOn"], function (val, splitOn) {
    val = krl.toString(val);
    if (!krl.isRegExp(splitOn)) {
      splitOn = krl.toString(splitOn);
    }
    return val.split(splitOn);
  }),

  substr: krl.Function(["val", "start", "len"], function (val, start, len) {
    val = krl.toString(val);
    start = krl.toNumberOrNull(start);
    len = krl.toNumberOrNull(len);
    if (start === null) {
      return val;
    }
    if (start > val.length) {
      return "";
    }
    var end;
    if (len === null) {
      end = val.length;
    } else if (len > 0) {
      end = start + len;
    } else {
      end = val.length + len;
    }
    return val.substring(start, end);
  }),

  trimLeading: krl.Function(["val"], function (val) {
    return _.trimStart(krl.toString(val));
  }),
  trimTrailing: krl.Function(["val"], function (val) {
    return _.trimEnd(krl.toString(val));
  }),
  trim: krl.Function(["val"], function (val) {
    return krl.toString(val).trim();
  }),

  startsWith: krl.Function(["val", "target"], function (val, target) {
    val = krl.toString(val);
    target = krl.toString(target);
    return _.startsWith(val, target);
  }),
  endsWith: krl.Function(["val", "target"], function (val, target) {
    val = krl.toString(val);
    target = krl.toString(target);
    return _.endsWith(val, target);
  }),
  contains: krl.Function(["val", "target"], function (val, target) {
    val = krl.toString(val);
    target = krl.toString(target);
    return _.includes(val, target);
  }),

  replace: krl.Function(["val", "regex", "replacement"], async function (
    val,
    regex,
    replacement
  ) {
    if (arguments.length < 2) {
      return val;
    }
    val = krl.toString(val);
    if (!krl.isString(regex) && !krl.isRegExp(regex)) {
      regex = krl.toString(regex);
    }
    if (krl.isNull(replacement)) {
      return val.replace(regex, "");
    }
    if (krl.isFunction(replacement)) {
      regex = stdlib.as(this, [regex, "RegExp"]);
      var out = "";
      var lastI = 0;
      var m;
      while ((m = regex.exec(val))) {
        // eslint-disable-line no-cond-assign
        out +=
          val.substring(lastI, m.index) +
          (await replacement(this, m.concat([m.index, val])));
        lastI = m.index + m[0].length;
        if (!regex.global) {
          break;
        }
      }
      out += val.substring(lastI);
      return out;
    }
    return val.replace(regex, krl.toString(replacement));
  }),

  /////////////////////////////////////////////////////////////////////////////
  // Collection operators
  all: krl.Function(["val", "iter"], async function (val, iter) {
    let broke = false;
    await iterBase(val, async (v, k, obj) => {
      const r = await iter(this, [v, k, obj]);
      if (!r) {
        broke = true;
        return false; // stop
      }
      return true;
    });
    return !broke;
  }),
  notall: krl.Function(["val", "iter"], async function (val, iter) {
    const b = await stdlib.all(this, [val, iter]);
    return !b;
  }),

  any: krl.Function(["val", "iter"], async function (val, iter) {
    var broke = false;
    await iterBase(val, async (v, k, obj) => {
      var r = await iter(this, [v, k, obj]);
      if (r) {
        broke = true;
        return false; // stop
      }
      return true;
    });
    return broke;
  }),
  none: krl.Function(["val", "iter"], async function (val, iter) {
    const b = await stdlib.any(this, [val, iter]);
    return !b;
  }),

  append: krl.Function(["val", "a", "b", "c", "d", "e"], async function (
    ...args: any[]
  ) {
    return _.concat.apply(null, args as any);
  }),

  collect: krl.Function(["val", "iter"], async function (val, iter) {
    if (krl.isNull(iter)) {
      iter = identity;
    }
    const grouped: any = {};
    await iterBase(val, async (v, k, obj) => {
      const r = await iter(this, [v, k, obj]);
      if (!grouped.hasOwnProperty(r)) {
        grouped[r] = [];
      }
      grouped[r].push(v);
      return true;
    });
    return grouped;
  }),

  filter: krl.Function(["val", "iter"], async function (val, iter) {
    if (krl.isNull(iter)) {
      iter = identity;
    }
    var isArr = krl.isArray(val);
    var result: any = isArr ? [] : {};
    await iterBase(val, async (v, k, obj) => {
      var r = await iter(this, [v, k, obj]);
      if (r) {
        if (isArr) {
          result.push(v);
        } else {
          result[k] = v;
        }
      }
      return true;
    });
    return result;
  }),

  map: krl.Function(["val", "iter"], async function (val, iter) {
    if (krl.isNull(iter)) {
      iter = identity;
    }
    const isArr = krl.isArray(val);
    const result: any = isArr ? [] : {};
    await iterBase(val, async (v, k, obj) => {
      const r = await iter(this, [v, k, obj]);
      if (isArr) {
        result.push(r);
      } else {
        result[k] = r;
      }
      return true;
    });
    return result;
  }),

  head: krl.Function(["val"], function (val) {
    if (!krl.isArray(val)) {
      return val; // head is for arrays; pretend val is a one-value array
    }
    return val[0];
  }),
  tail: krl.Function(["val"], function (val) {
    if (!krl.isArray(val)) {
      return [];
    }
    return _.tail(val);
  }),

  index: krl.Function(["val", "elm"], function (val, elm) {
    if (!krl.isArray(val)) {
      throw new TypeError("only works on Arrays");
    }
    return _.findIndex(val, _.partial(krl.isEqual, elm));
  }),

  join: krl.Function(["val", "str"], function (val, str) {
    if (!krl.isArray(val)) {
      return krl.toString(val);
    }
    val = _.map(val, krl.toString);
    if (krl.isNull(str)) {
      str = ",";
    }
    return _.join(val, krl.toString(str));
  }),

  length: krl.Function(["val"], function (val) {
    if (krl.isArrayOrMap(val) || krl.isString(val)) {
      return _.size(val);
    }
    return 0;
  }),

  isEmpty: krl.Function(["val"], function (val) {
    return _.isEmpty(val);
  }),

  pairwise: krl.Function(["val", "iter"], async function (val, iter) {
    if (!krl.isArray(val)) {
      throw new TypeError(
        "The .pairwise() operator cannot be called on " + krl.toString(val)
      );
    }
    if (val.length < 2) {
      throw new TypeError("The .pairwise() operator needs a longer array");
    }
    if (!krl.isFunction(iter)) {
      throw new TypeError(
        "The .pairwise() operator cannot use " +
          krl.toString(iter) +
          " as a function"
      );
    }
    val = _.map(val, function (v) {
      if (krl.isArray(v)) {
        return v;
      }
      return [v];
    });
    var maxLen = _.max(_.map(val, _.size)) || 0;

    var r = [];

    var i;
    var j;
    var args2;
    for (i = 0; i < maxLen; i++) {
      args2 = [];
      for (j = 0; j < val.length; j++) {
        args2.push(val[j][i]);
      }
      r.push(await iter(this, args2));
    }
    return r;
  }),

  reduce: krl.Function(["val", "iter", "dflt"], async function (
    val,
    iter,
    dflt
  ) {
    if (!krl.isArray(val)) {
      throw new TypeError("only works on Arrays");
    }
    var noDefault = arguments.length < 3;
    if (val.length === 0) {
      return noDefault ? 0 : dflt;
    }
    if (!krl.isFunction(iter) && (noDefault || val.length > 1)) {
      throw new Error(
        "The .reduce() operator cannot use " +
          krl.toString(iter) +
          " as a function"
      );
    }
    if (val.length === 1) {
      var head = val[0];
      if (noDefault) {
        return head;
      }
      return iter(this, [dflt, head, 0, val]);
    }
    var acc = dflt;
    var isFirst = true;
    await iterBase(val, async (v, k, obj) => {
      if (isFirst && noDefault) {
        isFirst = false;
        acc = v;
        return true; // continue
      }
      acc = await iter(this, [acc, v, k, obj]);
      return true; // continue
    });
    return acc;
  }),

  reverse: krl.Function(["val"], function (val) {
    if (!krl.isArray(val)) {
      throw new TypeError("only works on Arrays");
    }
    return _.reverse(_.cloneDeep(val));
  }),

  slice: krl.Function(["val", "start", "end"], function (val, start, end) {
    if (!krl.isArray(val)) {
      throw new TypeError("only works on Arrays");
    }
    if (val.length === 0) {
      return [];
    }
    if (arguments.length === 1) {
      return val;
    }
    var firstIndex = krl.toNumberOrNull(start);
    if (firstIndex === null) {
      throw new TypeError(
        "The .slice() operator cannot use " +
          krl.toString(start) +
          " as an index"
      );
    }
    if (arguments.length === 2) {
      if (firstIndex > val.length) {
        return [];
      }
      return _.slice(val, 0, firstIndex + 1);
    }
    var secondIndex = krl.toNumberOrNull(end);
    if (secondIndex === null) {
      throw new TypeError(
        "The .slice() operator cannot use " +
          krl.toString(end) +
          " as the other index"
      );
    }
    if (firstIndex > secondIndex) {
      // this is why firstIndex isn't named startIndex
      var temp = firstIndex;
      firstIndex = secondIndex;
      secondIndex = temp;
    }
    if (firstIndex >= 0 && secondIndex < val.length) {
      return _.slice(val, firstIndex, secondIndex + 1);
    }
    return [];
  }),

  splice: krl.Function(["val", "start", "nElements", "value"], function (
    val,
    start,
    nElements,
    value
  ) {
    if (!krl.isArray(val)) {
      throw new TypeError("only works on Arrays");
    }
    if (val.length === 0) {
      return [];
    }
    var startIndex = krl.toNumberOrNull(start);
    if (startIndex === null) {
      throw new TypeError(
        "The .splice() operator cannot use " +
          krl.toString(start) +
          "as an index"
      );
    }
    startIndex = Math.min(Math.max(startIndex, 0), val.length - 1);

    var nElm = krl.toNumberOrNull(nElements);
    if (nElm === null) {
      throw new TypeError(
        "The .splice() operator cannot use " +
          krl.toString(nElements) +
          "as a number of elements"
      );
    }
    if (nElm < 0 || startIndex + nElm > val.length) {
      nElm = val.length - startIndex;
    }
    var part1 = _.slice(val, 0, startIndex);
    var part2 = _.slice(val, startIndex + nElm);
    if (arguments.length < 4) {
      return _.concat(part1, part2);
    }
    return _.concat(part1, value, part2);
  }),

  delete: krl.Function(["val", "path"], function (val, path) {
    path = toKeyPath(path);
    // TODO optimize
    var nVal = _.cloneDeep(val);
    _.unset(nVal, path);
    return nVal;
  }),

  encode: krl.Function(["val", "indent"], function (val, indent) {
    return krl.encode(val, indent);
  }),

  keys: krl.Function(["val", "path"], function (val, path) {
    if (!krl.isArrayOrMap(val)) {
      return [];
    }
    if (path) {
      path = toKeyPath(path);
      return _.keys(_.get(val, path));
    }
    return _.keys(val);
  }),

  values: krl.Function(["val", "path"], function (val, path) {
    if (!krl.isArrayOrMap(val)) {
      return [];
    }
    if (path) {
      path = toKeyPath(path);
      return _.values(_.get(val, path));
    }
    return _.values(val);
  }),

  intersection: krl.Function(["a", "b"], function (a, b) {
    if (arguments.length < 2) {
      return [];
    }
    if (!krl.isArray(a)) {
      a = [a];
    }
    if (!krl.isArray(b)) {
      b = [b];
    }
    return _.intersectionWith(a, b, krl.isEqual);
  }),

  union: krl.Function(["a", "b"], function (a, b) {
    if (arguments.length < 2) {
      return a;
    }
    if (!krl.isArray(a)) {
      a = [a];
    }
    if (!krl.isArray(b)) {
      b = [b];
    }
    return _.unionWith(a, b, krl.isEqual);
  }),

  difference: krl.Function(["a", "b"], function (a, b) {
    if (arguments.length < 2) {
      return a;
    }
    if (!krl.isArray(a)) {
      a = [a];
    }
    if (!krl.isArray(b)) {
      b = [b];
    }
    return _.differenceWith(a, b, krl.isEqual);
  }),

  has: krl.Function(["val", "other"], function (val, other) {
    if (!krl.isArray(val)) {
      val = [val];
    }
    return stdlib.difference(this, [other, val]).length === 0;
  }),

  once: krl.Function(["val"], function (val) {
    if (!krl.isArray(val)) {
      return val;
    }
    // TODO optimize
    val = krl.cleanNulls(val);
    var r: any[] = [];
    _.each(_.groupBy(val), function (group) {
      if (group.length === 1) {
        r.push(group[0]);
      }
    });
    return r;
  }),

  duplicates: krl.Function(["val"], function (val) {
    if (!krl.isArray(val)) {
      return [];
    }
    // TODO optimize
    val = krl.cleanNulls(val);
    var r: any[] = [];
    _.each(_.groupBy(val), function (group) {
      if (group.length > 1) {
        r.push(group[0]);
      }
    });
    return r;
  }),

  unique: krl.Function(["val"], function (val) {
    if (!krl.isArray(val)) {
      return val;
    }
    return _.uniqWith(val, krl.isEqual);
  }),

  put: krl.Function(["val", "path", "toSet"], function (val, path, toSet) {
    if (!krl.isArrayOrMap(val) || arguments.length < 2) {
      return val;
    }
    if (arguments.length < 3) {
      toSet = path;
      path = [];
    }
    val = _.cloneDeep(val);
    path = toKeyPath(path);
    if (_.isEmpty(path)) {
      if (krl.isMap(toSet)) {
        if (krl.isMap(val)) {
          return _.assign({}, val, toSet);
        }
      } else if (krl.isArray(toSet)) {
        if (krl.isArray(val)) {
          return _.assign([], val, toSet);
        }
      }
      return toSet;
    }
    var nVal = val;
    var nested = nVal;
    var i, key;
    for (i = 0; i < path.length; i++) {
      key = path[i];
      if (i === path.length - 1) {
        nested[key] = toSet;
      } else {
        if (krl.isMap(nested[key])) {
          // simply traverse down
        } else if (krl.isArray(nested[key])) {
          var nextKey = path[i + 1];
          if (isSafeArrayIndex(nested[key], nextKey)) {
            // simply traverse down
          } else {
            // convert Array to Map b/c the key is not a safe index
            nested[key] = _.assign({}, nested[key]);
          }
        } else {
          // need to create a Map to continue
          nested[key] = {};
        }
        nested = nested[key];
      }
    }
    return nVal;
  }),

  sort: krl.Function(["val", "sortBy"], function (val, sortBy) {
    if (!krl.isArray(val)) {
      return val;
    }
    val = _.cloneDeep(val);
    var sorters: { [key: string]: (a: any, b: any) => number } = {
      default: (a: any, b: any) => {
        return stdlib.cmp(this, [a, b]);
      },
      reverse: (a: any, b: any) => {
        return -stdlib.cmp(this, [a, b]);
      },
      numeric: (a: any, b: any) => {
        return stdlib["<=>"](this, [a, b]);
      },
      ciremun: (a: any, b: any) => {
        return -stdlib["<=>"](this, [a, b]);
      },
    };
    if (_.has(sorters, sortBy)) {
      return val.sort(sorters[sortBy]);
    }
    if (!krl.isFunction(sortBy)) {
      return val.sort(sorters["default"]);
    }
    return asyncSort(val, (a: any, b: any) => {
      return sortBy(this, [a, b]);
    });
  }),

  /////////////////////////////////////////////////////////////////////////////
  get: krl.Function(["obj", "path"], function (obj, path) {
    if (!krl.isArrayOrMap(obj)) {
      return null;
    }
    path = toKeyPath(path);
    return _.get(obj, path, null);
  }),

  set: krl.Function(["obj", "path", "val"], function (obj, path, val) {
    if (!krl.isArrayOrMap(obj)) {
      obj = {};
    }
    path = toKeyPath(path);
    // TODO optimize
    obj = _.cloneDeep(obj);
    return _.set(obj, path, val);
  }),

  noop: krl.ActionFunction([], () => null),

  send_directive: krl.Action(["name", "options"], function (name, options) {
    return this.addDirective(name, options);
  }),
};

export default stdlib;
