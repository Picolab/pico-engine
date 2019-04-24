module.exports = function($krl) {
  return {
    rid: "io.picolabs.hello",
    version: "0.0.0",
    meta: {
      name: "Hello World",
      description: "\nA first ruleset for the Quickstart\n    ",
      author: "Phil Windley",
      shares: ["hello", "said"]
    },
    init: async function($ctx) {
      const hello = $krl.function(["name"], async function(name = "default") {
        const msg = await $krl.stdlib("+", ["Hello ", name]);
        return msg;
      });
      const said = $krl.function([], async function() {
        return await $ctx.getEnt("said");
      });
      const $rs = new $krl.SelectWhen();
      $rs.when($krl.e("say:hello"), async function($event, $state) {
        var fired = true;
        if (fired) $krl.log.debug($ctx, $event, "fired");
        else $krl.log.debug($ctx, $event, "not fired");
        await $ctx.putEnt(
          "said",
          await $krl.stdlib("get", [$event.data.attrs, "name"])
        );
      });
      return {
        event: async function(event) {
          await $rs.send(event);
        },
        query: {
          hello: hello,
          said: said,
          __testing: function() {
            return {
              queries: [
                {
                  name: "hello",
                  args: ["name"]
                },
                {
                  name: "said",
                  args: []
                }
              ],
              events: [
                {
                  domain: "say",
                  name: "hello",
                  attrs: ["name"]
                }
              ]
            };
          }
        }
      };
    }
  };
};
