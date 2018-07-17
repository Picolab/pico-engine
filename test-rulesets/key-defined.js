module.exports = {
  "rid": "io.picolabs.key-defined",
  "meta": {
    "name": "key-defined",
    "description": "\nThis is a test file for a module that only stores API keys\n        ",
    "keys": {
      "foo": "foo key just a string",
      "bar": {
        "baz": "baz subkey for bar key",
        "qux": "qux subkey for bar key"
      },
      "quux": "this key is not shared",
      "quuz": "this is shared to someone else"
    },
    "provides": ["blah"],
    "provides_keys": {
      "quuz": { "to": ["io.picolabs.key-used2"] },
      "foo": {
        "to": [
          "io.picolabs.key-used",
          "io.picolabs.key-used2",
          "io.picolabs.key-used3"
        ]
      },
      "bar": {
        "to": [
          "io.picolabs.key-used",
          "io.picolabs.key-used2",
          "io.picolabs.key-used3"
        ]
      }
    },
    "shares": ["foo_global"]
  },
  "global": async function (ctx) {
    ctx.scope.set("blah", "this is here to test that 'provides' is not stomped over by 'provides keys'");
    ctx.scope.set("foo_global", await ctx.modules.get(ctx, "keys", "foo"));
  },
  "rules": {}
};