import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      'block-scoped-var': 'error',
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'eol-last': 'error',
      'prefer-arrow-callback': 'error',
      'no-trailing-spaces': 'error',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-warning-comments': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/camelcase': 'off',
      // 'n/no-missing-import': 'off',
      // 'n/no-empty-function': 'off',
      // 'n/no-unsupported-features/es-syntax': 'off',
      // 'n/no-missing-require': 'off',
      // 'n/shebang': 'off',
      'no-dupe-class-members': 'off',
      'require-atomic-updates': 'off',
      quotes: ['warn', 'single', {avoidEscape: true}],
      'no-restricted-properties': [
        'error',
        {
          object: 'describe',
          property: 'only',
        },
        {
          object: 'it',
          property: 'only',
        },
      ],
      // 'no-unused-vars': 'off',
      // '@typescript-eslint/no-unused-vars': [
      //   'warn',
      //   {
      //     argsIgnorePattern: '^_',
      //     varsIgnorePattern: '^_',
      //     caughtErrorsIgnorePattern: '^_',
      //   },
      // ],
    },
  },
  eslintConfigPrettier,
];
