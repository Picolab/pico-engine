module.exports = {
  "rid": "io.picolabs.expressions",
  "global": function (ctx) {
    ctx.scope.set("cond_exp_1", true ? 1 : 2);
    ctx.scope.set("cond_exp_2", false ? 1 : 2);
  },
  "rules": {}
};