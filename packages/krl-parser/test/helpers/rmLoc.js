module.exports = function rmLoc(node) {
  if (Array.isArray(node)) {
    return node.map(rmLoc);
  }
  if (Object.prototype.toString.call(node) === "[object Object]") {
    const cleanNode = {};
    for (const key of Object.keys(node)) {
      if (key !== "loc") cleanNode[key] = rmLoc(node[key]);
    }
    return cleanNode;
  }
  return node;
};
