import { krl } from "krl-stdlib";
const moment = require("moment-timezone");
const strftime = require("strftime");

function newDate(dateStr: string, parseUtc: boolean = false) {
  var parse = function (str: string) {
    return parseUtc
      ? moment.utc(str, moment.ISO_8601)
      : moment(str, moment.ISO_8601);
  };
  var d = parse(dateStr);
  if (!d.isValid()) {
    var today = new Date().toISOString().split("T")[0];
    d = parse(today + "T" + dateStr);
    if (!d.isValid()) {
      d = parse(today.replace(/-/g, "") + "T" + dateStr);
    }
  }
  if (!d.isValid()) {
    return null; // invalid date string dateStr
  }
  return d;
}

const time: krl.Module = {
  now: krl.Function(["opts"], function (opts: any) {
    const d = moment();
    if (opts) {
      if (!krl.isMap(opts)) {
        throw new TypeError(
          "time:now was given " + krl.toString(opts) + " instead of an opts map"
        );
      }
      if (opts.tz) {
        d.tz(opts.tz);
      }
    }
    return d.toISOString();
  }),

  new: krl.Function(["date"], function (date: string) {
    if (!date) {
      throw new Error("time:new needs a date string");
    }

    var dateStr = krl.toString(date);
    var d = krl.isNumber(date) ? new Date(date) : newDate(dateStr, true);
    if (d === null) {
      if (krl.isString(date)) {
        throw new Error(
          "time:new was given an invalid date string (" + dateStr + ")"
        );
      }
      throw new TypeError(
        "time:new was given " +
          krl.toString(dateStr) +
          " instead of a date string"
      );
    }
    return d.toISOString();
  }),

  add: krl.Function(["date", "spec"], (date: string, spec: any) => {
    if (!date) {
      throw new Error("time:add needs a date string");
    }
    if (!spec) {
      throw new Error("time:add needs a spec map");
    }

    var dateStr = krl.toString(date);
    var d = newDate(dateStr, true);
    if (d === null) {
      if (krl.isString(date)) {
        throw new Error(
          "time:add was given an invalid date string (" + dateStr + ")"
        );
      }
      throw new TypeError(
        "time:add was given " +
          krl.toString(dateStr) +
          " instead of a date string"
      );
    }

    if (!krl.isMap(spec)) {
      throw new TypeError(
        "time:add was given " + krl.toString(spec) + " instead of a spec map"
      );
    }

    d.add(spec);

    return d.toISOString();
  }),

  strftime: krl.Function(["date", "fmt"], function (date, fmt) {
    if (!date) {
      throw new Error("time:strftime needs a date string");
    }
    if (!fmt) {
      throw new Error("time:strftime needs a fmt string");
    }

    var dateStr = krl.toString(date);
    var d = newDate(dateStr);
    if (d === null) {
      if (krl.isString(date)) {
        throw new Error(
          "time:strftime was given an invalid date string (" + dateStr + ")"
        );
      }
      throw new TypeError(
        "time:strftime was given " +
          krl.toString(dateStr) +
          " instead of a date string"
      );
    }

    if (!krl.isString(fmt)) {
      throw new TypeError(
        "time:strftime was given " +
          krl.toString(fmt) +
          " instead of a fmt string"
      );
    }

    return strftime(fmt, d.toDate());
  }),
};

export default time;
