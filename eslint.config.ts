import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import pluginVitest from "@vitest/eslint-plugin";

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{vue,ts,mts,tsx}"],
  },
  globalIgnores(["**/dist/**", "**/coverage/**"]),
  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommendedTypeChecked,
  { ...pluginVitest.configs.recommended, files: ["**/__tests__/*"] },
  {
    rules: {
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
