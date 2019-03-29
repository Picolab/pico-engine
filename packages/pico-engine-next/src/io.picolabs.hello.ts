import { Ruleset, RulesetInstance } from "pico-framework";
import { SelectWhen, e } from "select-when";
import { PicoEventPayload } from "pico-framework/dist/src/PicoEvent";
import _ = require("lodash");

function krlNamedArgs(paramOrder: string[]) {
  return function(args: any) {
    const namedArgs: { [name: string]: any } = {};
    _.each(args, function(arg, key: any) {
      if (_.has(paramOrder, key)) {
        namedArgs[paramOrder[key]] = arg;
      } else if (_.includes(paramOrder, key)) {
        namedArgs[key] = arg;
      }
    });
    return namedArgs;
  };
}

const $krl = {
  SelectWhen: SelectWhen,
  e: e,
  function(
    paramOrder: string[],
    fn: (args: { [name: string]: any }) => Promise<any>
  ) {
    const fixArgs = krlNamedArgs(paramOrder);
    return function(args: any) {
      return fn(fixArgs(args));
    };
  }
};

export const rsHello: Ruleset = {
  rid: "io.picolabs.hello",
  version: "0.0.0",
  // TODO meta { name, description, author }
  async init($ctx): Promise<RulesetInstance> {
    const hello = $krl.function(["name"], async function($args) {
      const name = $args.name;
      const msg = "Hello " + name;
      return msg;
    });

    const said = $krl.function([], async function($args) {
      return await $ctx.getEnt("said");
    });
    const $rs = new $krl.SelectWhen<PicoEventPayload, {}, void>();

    $rs.when($krl.e("say:hello"), async ($event, $state) => {
      const $attrs = ($event.data && $event.data.attrs) || {};
      $ctx.putEnt("said", $attrs["name"]);
    });

    return {
      async event(event) {
        await $rs.send(event);
      },
      query: {
        __testing() {
          // TODO the compiler should emit these
          return {
            queries: [
              { name: "hello", args: ["name"] },
              { name: "said", args: [] }
            ],
            events: [{ domain: "say", name: "hello", attrs: ["name"] }]
          };
        },
        hello,
        said: said
      }
    };
  }
};
