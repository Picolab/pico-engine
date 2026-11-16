import { Event } from "select-when";
import { isNotStringOrBlank } from "./utils";

export interface PicoEventPayload {
  attrs: { [name: string]: any };
}

export interface PicoEvent extends Event<PicoEventPayload> {
  eci: string;
  domain: string;
  name: string;
  data: PicoEventPayload;
  time: number;
}

/**
 * Given an event json (i.e. from the web, or somewhere untrusted)
 *   + assert the required pieces are there
 *   + normalize the shape/naming conventions
 *   + make a full copy (clone) as to not mutate the original
 */
export function cleanEvent(
  eventOrig: any,
  time: number = Date.now()
): PicoEvent {
  if (isNotStringOrBlank(eventOrig && eventOrig.eci)) {
    throw new Error("missing event.eci");
  }
  if (isNotStringOrBlank(eventOrig.domain)) {
    throw new Error("missing event.domain");
  }
  if (isNotStringOrBlank(eventOrig.name)) {
    throw new Error("missing event.name");
  }

  var attrs = {};
  if (eventOrig.data && eventOrig.data.hasOwnProperty("attrs")) {
    // we want to make sure only json-able values are in the attrs
    // also want to clone it as to not mutate the original copy
    const json = JSON.stringify(eventOrig.data.attrs);
    // only if it's a map do we consider it valid
    if (json && json[0] === "{") {
      attrs = JSON.parse(json);
    } else if (
      eventOrig.data.attrs === null ||
      eventOrig.data.attrs === undefined
    ) {
      // default to {}
    } else {
      throw new Error("Expected a JSON map for event.data.attrs");
    }
  }

  return {
    eci: eventOrig.eci.trim(),
    domain: eventOrig.domain.trim(),
    name: eventOrig.name.trim(),
    data: { attrs },
    time
  };
}
