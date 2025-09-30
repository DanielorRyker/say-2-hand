const baseConfig = require("./base.js");

module.exports = {
  ...baseConfig,
  extends: [...baseConfig.extends, "next/core-web-vitals"],
  env: {
    ...baseConfig.env,
    browser: true,
  },
  rules: {
    ...baseConfig.rules,
    "react/no-unescaped-entities": "off",
    "@next/next/no-page-custom-font": "off",
  },
};
