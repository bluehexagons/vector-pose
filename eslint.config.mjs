import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

const custom = {
  "extends": [
    "eslint:recommended",
    "plugin:n/recommended",
    "prettier"
  ],
  "plugins": [
    "n",
    "prettier"
  ],
  "rules": {
    "prettier/prettier": "error",
    "block-scoped-var": "error",
    "eqeqeq": "error",
    "no-var": "error",
    "prefer-const": "error",
    "eol-last": "error",
    "prefer-arrow-callback": "error",
    "no-trailing-spaces": "error",
    "quotes": ["warn", "single", { "avoidEscape": true }],
    "no-restricted-properties": [
      "error",
      {
        "object": "describe",
        "property": "only"
      },
      {
        "object": "it",
        "property": "only"
      }
    ],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ]
  },
  "overrides": [
    {
      "files": ["**/*.ts", "**/*.tsx"],
      "parser": "@typescript-eslint/parser",
      "extends": [
        "plugin:@typescript-eslint/recommended"
      ],
      "rules": {
        "@typescript-eslint/ban-ts-comment": "warn",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-warning-comments": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/camelcase": "off",
        "n/no-missing-import": "off",
        "n/no-empty-function": "off",
        "n/no-unsupported-features/es-syntax": "off",
        "n/no-missing-require": "off",
        "n/shebang": "off",
        "no-dupe-class-members": "off",
        "require-atomic-updates": "off"
      },
      "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
      }
    }
  ]
}

export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...custom
];