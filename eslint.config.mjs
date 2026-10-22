import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships flat configs, so no FlatCompat wrapper
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Compiler readiness checks (new in eslint-plugin-react-hooks 6). The app doesn't use the
    // compiler and these patterns are deliberate (e.g. state synced from storage on mount), so warn only.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
      // `const { secret: _s, ...rest } = obj` drops a field on purpose
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "marketing/**", "scripts/**", ".claude/**"]),
]);

export default eslintConfig;
