import js from '@eslint/js'
import tsEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
    {
        ignores : ['node_modules/**', 'build/**', '*.js', '*.mjs']
    },
    js.configs.recommended,
    {
        files : ['**/*.ts'],
        languageOptions : {
            parser : tsParser,
            parserOptions : {
                ecmaVersion : 'latest',
                sourceType : 'module'
            },
            globals : {
                console : 'readonly',
                process : 'readonly',
                Buffer : 'readonly',
                __dirname : 'readonly',
                __filename : 'readonly',
                exports : 'readonly',
                module : 'readonly',
                require : 'readonly',
                global : 'readonly',
                setTimeout : 'readonly',
                setInterval : 'readonly',
                clearTimeout : 'readonly',
                clearInterval : 'readonly',
                URL : 'readonly'
            }
        },
        plugins : {
            '@typescript-eslint' : tsEslint
        },
        rules : {
            // Disable conflicting rules
            'no-unused-vars' : 'off',
            'no-shadow' : 'off',

            // Basic rules
            'max-len' : ['warn', { code : 140, tabWidth : 4 }],
            'no-async-promise-executor' : 'off',

            // TypeScript rules
            '@typescript-eslint/no-explicit-any' : 'off',
            '@typescript-eslint/no-unused-vars' : 'warn',
            '@typescript-eslint/ban-ts-comment' : 'warn',
            '@typescript-eslint/no-inferrable-types' : 'off',
            '@typescript-eslint/no-empty-interface' : 'error',

            // Code quality rules derived from tslint config
            'curly' : 'error',
            'eqeqeq' : ['error', 'always', { null : 'ignore' }],
            'no-bitwise' : 'error',
            'no-console' : ['error', { allow : ['warn', 'error'] }],
            'no-debugger' : 'error',
            'no-eval' : 'error',
            'no-throw-literal' : 'error',
            'no-trailing-spaces' : 'off',
            'no-undef-init' : 'error',
            'no-unsafe-finally' : 'error',
            'quotes' : ['error', 'single', { avoidEscape : true }],
            'radix' : 'error',
            'semi' : ['error', 'never'],
            'prefer-const' : 'error'
        }
    },
    {
        files : ['tests/**/*.ts'],
        rules : {
            '@typescript-eslint/no-unused-vars' : 'off',
            '@typescript-eslint/no-explicit-any' : 'off'
        }
    }
]
