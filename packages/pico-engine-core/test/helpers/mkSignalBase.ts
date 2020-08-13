import { PicoFramework } from "pico-framework";
import { cleanDirectives } from "./cleanDirectives";

export function mkSignalBase(pf: PicoFramework) {
  return function (eci: string) {
    return async function (
      domain: string,
      name: string,
      attrs: any = {},
      time: number = 0
    ) {
      const resp = await pf.eventWait({
        eci,
        domain,
        name,
        data: { attrs },
        time,
      });
      return cleanDirectives(resp.responses);
    };
  };
}
