import {fixupConfigRules} from '@eslint/compat';
import {FlatCompat} from '@eslint/eslintrc';
import js from '@eslint/js';
// eslint-disable-next-line import/no-unresolved
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:import/recommended',
      'plugin:import/electron',
      'plugin:import/typescript',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended'
    )
  ),
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
    },

    rules: {
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-unused-vars': 1,
      'react/react-in-jsx-scope': 0,
      'react/prop-types': 0,
    },

    ignores: [],
  },
];
