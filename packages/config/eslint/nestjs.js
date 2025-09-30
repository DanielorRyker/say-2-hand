const baseConfig = require("./base.js");

module.exports = {
  ...baseConfig,
  rules: {
    ...baseConfig.rules,
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};
