import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import pluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Golden markdown files are Obsidian output with wikilinks, not documents to lint.
  { ignores: ["tests/**/fixtures/**/*.md"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"].map((config) => ({ ...config, files: ["**/*.vue"] })),
  { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  // Formatting belongs to Prettier; this turns off the Vue layout rules that disagree with it.
  eslintConfigPrettier,
  { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/commonmark", extends: ["markdown/recommended"] },
]);
