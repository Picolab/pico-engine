module.exports = function normalizeAST(ast) {
  if (Array.isArray(ast)) {
    return ast.map(normalizeAST);
  }
  if (Object.prototype.toString.call(ast) === "[object Object]") {
    if (ast.type === "RegExp") {
      if (new RegExp("/").toString() === "///") {
        // old versions of v8 botch this
        ast.value =
          "/" +
          ast.value.source.split("\\").join("") +
          "/" +
          (ast.value.global ? "g" : "") +
          (ast.value.ignoreCase ? "i" : "");
      } else {
        ast.value = ast.value.toString();
      }
    }
  }
  return ast;
};
