import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores, defineConfig } from 'eslint/config'

export default defineConfig([
  // ignore build output (replacement for your globalIgnores(['dist']))
  globalIgnores(["dist"]),

  // base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // project rules / overrides
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["vite.config.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      // optional but recommended if you later use type-aware rules:
      parserOptions: { projectService: true },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // react-hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // react-refresh (Vite)
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
]);
