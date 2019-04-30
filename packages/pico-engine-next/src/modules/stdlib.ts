import * as _ from "lodash";
import krl, { KrlModule } from "../krl";

const stdlib: KrlModule = {
  "+": krl.function(["left", "right"], function(left: any, right: any) {
    return left + right;
  }),

  get: krl.function([], function(obj, path) {
    return _.get(obj, path, null);
  })
};

export default stdlib;
