import { Ruleset, RulesetInstance } from "pico-framework";
import { SelectWhen, e } from "select-when";
import { PicoEventPayload } from "pico-framework/dist/src/PicoEvent";

const $krl = {
  SelectWhen: SelectWhen,
  e: e,
  function(
    args: string[],
    fn: (args: { [name: string]: any }) => Promise<any>
  ) {
    return (...origArgs: any[]) => {
      const namedArgs: { [name: string]: any } = {};
      for (let i = 0; i < args.length; i++) {
        const name = args[i];
        namedArgs[name] = origArgs[i];
      }
      return fn(namedArgs);
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
        hello: hello,
        said: said
      }
    };
  }
};
