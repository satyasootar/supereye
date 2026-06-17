import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    // Dev / one-off scripts (not production app code)
    "fix-layout.cjs",
    "local-cron.mjs",
    "resync-emails.ts",
    "register-webhook.ts",
    "register-webhooks.ts",
    "test-ai-corsair.ts",
    "tests/**",
  ]),
  {
    rules: {
      // Pre-existing codebase — warn instead of blocking CI/deploy
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "prefer-const": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-img-element": "warn",
      // React Compiler rules — too strict for current patterns (mounted flags, OAuth redirects)
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
    },
  },
  {
    files: ["**/*.test.ts", "lib/**/__tests__/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["types/**/*.d.ts"],
    rules: {
      "no-var": "off",
    },
  },
]);

export default eslintConfig;
