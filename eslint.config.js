export default [
  {
    files: ["js/**/*.js", "build/**/*.js", "worker/**/*.js", "vite.config.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        CSS: "readonly",
        document: "readonly",
        localStorage: "readonly",
        process: "readonly",
        sessionStorage: "readonly",
        structuredClone: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    },
  },
];
