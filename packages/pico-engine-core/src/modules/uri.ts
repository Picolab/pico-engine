import { krl } from "krl-stdlib";

const uri: krl.Module = {
  escape: krl.Function(["str"], function (str) {
    return encodeURIComponent(krl.toString(str));
  }),

  unescape: krl.Function(["str"], function (str) {
    str = krl.toString(str);
    try {
      return decodeURIComponent(str);
    } catch (err) {
      throw new TypeError("uri:unescape got a malformed escape in " + str);
    }
  }),
};

export default uri;
