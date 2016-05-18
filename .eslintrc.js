module.exports = {
  "env": {
    "browser": true,
    "node": true,
    "commonjs": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "indent": "off",
    "quotes": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "linebreak-style": [
      "error",
      "unix"
    ],
    "semi": [
      "error",
      "always"
    ],
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "none"//unused arguments can provide good documentation about what is available
      }
    ],
    "no-multi-str": "error",
    "radix": "error"
  }
};
