import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const nodeLanguage = {
  globals: globals.node,
};

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "examples/**/.agent-workspace/**",
    ],
  },
  {
    ...eslint.configs.recommended,
    files: ["**/*.{js,mjs}"],
    languageOptions: nodeLanguage,
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts"],
    languageOptions: {
      ...config.languageOptions,
      ...nodeLanguage,
    },
  })),
);
