module.exports = {
  "env": {
    "browser": true,
    "node": true,
    "commonjs": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "indent":  ["error", 4],
    "no-console": "off",
    "quotes": ["error", "double"],
    "no-trailing-spaces": "error",
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
