import markdown from "@eslint/markdown";
import prettier from "eslint-plugin-prettier";

export default [
  ...markdown.configs.recommended,
  {
    plugins: { markdown, prettier },
    rules: {
      ...prettier.configs.recommended.rules,
      "prettier/prettier": [
        "error",
        {
          endOfLine: "lf",
          insertFinalNewline: true,
        },
      ],
      "markdown/fenced-code-language": "off",
      "markdown/no-missing-label-refs": "off",
    },
  },
];
