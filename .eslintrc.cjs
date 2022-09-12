// eslintrc.cjs

module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  ignorePatterns: ["docs/*", "build/*", "dist/*", "tmp/*"],
};
