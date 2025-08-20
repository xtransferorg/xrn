import chalk from "chalk";
import prompts from "prompts";

import { env } from "./utils/env";

export const LEGACY_TEMPLATES = [
  {
    title: "Bundle",
    value: "@xrnjs/bundle-template",
    description: "Bundle 项目",
  },
  {
    title: "App",
    value: "@xrnjs/app-template",
    description: "App 项目",
  },
];

export const ALIASES = LEGACY_TEMPLATES.map(({ value }) => value);

export async function promptTemplateAsync() {
  if (env.CI) {
    throw new Error("Cannot prompt for template in CI");
  }

  const { answer } = await prompts({
    type: "select",
    name: "answer",
    message: "Choose a template:",
    choices: LEGACY_TEMPLATES,
  });

  if (!answer) {
    console.log();
    console.log(
      chalk`Please specify the template, example: {cyan --template expo-template-blank}`
    );
    console.log();
    process.exit(1);
  }

  return answer;
}
