import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        HTMLCanvasElement: "readonly",
        CanvasRenderingContext2D: "readonly",
        MouseEvent: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Worker: "readonly",
        MessageEvent: "readonly",
        ErrorEvent: "readonly",
        // Node.js globals (for build scripts)
        NodeJS: "readonly",
        WheelEvent: "readonly",
        requestAnimationFrame: "readonly",
        ImageData: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off", // Use TypeScript version instead
      "no-console": "off",
      "no-case-declarations": "warn",
    },
  },
  prettier,
  {
    ignores: ["node_modules/**", "output/**", "build/**"],
  },
];
