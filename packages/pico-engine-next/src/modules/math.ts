import * as crypto from "crypto";
import { krl } from "krl-stdlib";
import * as _ from "lodash";

const hashAlgorithms = Object.freeze(crypto.getHashes());

const math: krl.Module = {
  base64encode: krl.Function(["str"], function (str) {
    str = krl.toString(str);
    return Buffer.from(str, "utf8").toString("base64");
  }),

  base64decode: krl.Function(["str"], function (str) {
    str = krl.toString(str);
    return Buffer.from(str, "base64").toString("utf8");
  }),

  hashAlgorithms: krl.Property(() => {
    return hashAlgorithms;
  }),

  hashFunctions: krl.Function(
    [
      // DEPRECATED
    ],
    function () {
      this.log.warn(
        "math:hashFunctions() is DEPRECATED use math:hashAlgorithms instead"
      );
      return hashAlgorithms;
    }
  ),

  hash: krl.Function(["algorithm", "str", "encoding"], function (
    algorithm,
    str,
    encoding
  ) {
    if (!_.includes(hashAlgorithms, algorithm)) {
      if (krl.isString(algorithm)) {
        throw new Error(
          "math:hash doesn't recognize the hash algorithm " + algorithm
        );
      } else {
        throw new TypeError(
          "math:hash was given " +
            krl.toString(algorithm) +
            " instead of a algorithm string"
        );
      }
    }
    encoding = encoding || "hex";
    if (!_.includes(["hex", "base64"], encoding)) {
      throw new Error(
        'math:hash encoding must be "hex" or "base64" but was ' + encoding
      );
    }

    str = krl.toString(str);
    var hash = crypto.createHash(algorithm);
    hash.update(str);

    return hash.digest(encoding);
  }),

  hmac: krl.Function(["algorithm", "key", "message", "encoding"], function (
    algorithm,
    key,
    message,
    encoding
  ) {
    if (!krl.isString(key)) {
      throw new Error("math:hmac needs a key string");
    }
    if (!_.includes(hashAlgorithms, algorithm)) {
      if (krl.isString(algorithm)) {
        throw new Error(
          "math:hmac doesn't recognize the hash algorithm " + algorithm
        );
      } else {
        throw new TypeError(
          "math:hmac was given " +
            krl.toString(algorithm) +
            " instead of a algorithm string"
        );
      }
    }
    encoding = encoding || "hex";
    if (!_.includes(["hex", "base64"], encoding)) {
      throw new Error(
        'math:hmac encoding must be "hex" or "base64" but was ' + encoding
      );
    }

    key = krl.toString(key);
    message = krl.toString(message);
    var hmac = crypto.createHmac(algorithm, key);
    hmac.update(message);

    return hmac.digest(encoding);
  }),

  abs: krl.Function(["number"], function (number) {
    return Math.abs(number);
  }),

  ceiling: krl.Function(["number", "precision"], function (number, precision) {
    return _.ceil(number, precision);
  }),

  floor: krl.Function(["number", "precision"], function (number, precision) {
    return _.floor(number, precision);
  }),

  int: krl.Function(["number"], function (number) {
    return number >= 0 ? _.floor(number, 0) : _.ceil(number, 0);
  }),

  round: krl.Function(["number", "precision"], function (number, precision) {
    return _.round(number, precision);
  }),
};

export default math;
