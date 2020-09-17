import { krl } from "krl-stdlib";

const ursa: krl.Module = {
  generateDID: krl.Function([], function () {
    // TODO generate a DID
    return {};
  }),
};

export default ursa;
