import krl, { KrlModule } from "../krl";

const stdlib: KrlModule = {
  "+": krl.function(["left", "right"], function(left: any, right: any) {
    return left + right;
  })
};

export default stdlib;
