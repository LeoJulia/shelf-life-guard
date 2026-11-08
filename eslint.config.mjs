import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Node-тесты мокают CommonJS `module` — это не код Next.js-приложения.
    files: ["scripts/**/*.test.mjs", "supabase/scripts/**/*.test.mjs"],
    rules: {
      "@next/next/no-assign-module-variable": "off",
    },
  },
  {
    // Vendored shadcn/ui: каноничный upstream-хук подписки на matchMedia.
    // React Compiler не включён, правило set-state-in-effect здесь неприменимо.
    files: ["src/shared/lib/use-mobile.ts"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  {
    // Vendored shadcn/ui skeleton: намеренная случайная ширина заглушки.
    files: ["src/shared/ui/sidebar.tsx"],
    rules: { "react-hooks/purity": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    // Локальные agent-инструменты и чужие worktrees (eslint не читает .gitignore).
    ".kilo/**",
    ".agents/**",
    ".aider-desk/**",
  ]),
]);

export default eslintConfig;
