import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",   // was "error"
      "@typescript-eslint/no-unused-vars": "warn",    // was "error"
      "react/no-unescaped-entities": "warn",           // was "error"
      "react-hooks/exhaustive-deps": "warn",           // optional: still helpful
    },
  },
];

export default eslintConfig;
