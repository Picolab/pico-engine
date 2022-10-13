import { Directive } from "krl-stdlib";

export interface CoreEventOutput {
  eid: string;
  directives: Directive[];
}

export function formatEventOutput(resp: {
  eid: string;
  responses: any[];
}): CoreEventOutput {
  const directives: Directive[] = [];

  for (const response of resp.responses) {
    if (Array.isArray(response)) {
      for (const part of response) {
        if (part && part.type === "directive") {
          directives.push(part);
        }
      }
    }
  }

  return {
    eid: resp.eid,
    directives,
  };
}
