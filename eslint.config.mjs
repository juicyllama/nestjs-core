// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
    {
		ignores: [
			'eslint.config.mjs',
			'**/*.spec.ts',
			'**/*.test.spec.ts',
			'**/*.test.paused.ts',
			'**/*.test.config.ts',
		],
	},
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    eslintPluginPrettierRecommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            sourceType: 'commonjs',
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            import: importPlugin,
            prettier: prettierPlugin,
        },
    },
    {
		rules: {
			// Custom overrides can go here
			'@typescript-eslint/no-explicit-any': 'off', // Relaxed for ORM patterns
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off', // Relaxed for TypeORM
			'@typescript-eslint/no-unsafe-argument': 'off', // Relaxed for TypeORM generics
			'@typescript-eslint/no-unsafe-member-access': 'off', // Relaxed for dynamic ORM operations
			'@typescript-eslint/restrict-template-expressions': 'off', // Allow more flexible template literals
			'@typescript-eslint/no-redundant-type-constituents': 'off', // Common in ORM type unions
			'@typescript-eslint/no-unnecessary-condition': 'off', // Relaxed for defensive ORM code
			'@typescript-eslint/no-misused-promises': 'off', // Common in async ORM patterns
            '@typescript-eslint/no-dynamic-delete': 'off', // Dynamic deletes in some utilities
            '@typescript-eslint/no-unsafe-return': 'off', // Relaxed for certain utility functions
            '@typescript-eslint/no-implied-eval': 'off', // Sometimes used in dynamic code
            '@typescript-eslint/prefer-promise-reject-errors': 'off', // Allow non-Error rejections in some cases
            '@typescript-eslint/no-floating-promises': 'off', // Relaxed for certain async utilities
            // Disabled because we use Prettier with @trivago/prettier-plugin-sort-imports
            'import/order': 'off',
		},
    },
    // Specific overrides for TypeORM/database utility files
    {
        files: ['src/utils/typeorm/**/*.ts', 'src/**/*.entity.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off', // Allow any in ORM utilities
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/no-redundant-type-constituents': 'off',
            '@typescript-eslint/no-unnecessary-condition': 'off', // TypeORM often requires defensive checks
        },
    },
    // Specific overrides for NestJS module files
    {
        files: ['**/*.module.ts', 'src/utils/**/*.ts'],
        rules: {
            '@typescript-eslint/no-extraneous-class': 'off', // NestJS modules and utility classes
        },
    }
);
