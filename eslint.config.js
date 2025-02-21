import markdown from "@eslint/markdown";

export default [
  ...markdown.configs.recommended,
  {
    plugins: { markdown },
    rules: {
      "markdown/fenced-code-language": "off",
      "markdown/no-missing-label-refs": "off",
    },
  },
];
