// deno run --allow-env --allow-read --allow-write --allow-net src/translate.ts

/// <reference lib="deno.ns" />

import "@std/dotenv/load";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { locales } from "./constant.ts";

const BASE_PATH = "./src/translate";

const createPrompt = async (language: string): Promise<string> => {
  const basePrompt = await Deno.readTextFile(`${BASE_PATH}/base-prompt.md`);
  const chromeExtDescription = await Deno.readTextFile(
    `${BASE_PATH}/chrome-ext-description.md`,
  );

  return basePrompt + "\n\n" +
    `[hl] ${language}` + "\n\n" +
    `[txt] ${chromeExtDescription}`;
};

const main = async () => {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

  for (const [locale, language] of Object.entries(locales)) {
    console.log(`Translating ${locale}(${language})...`);
    const prompt = await createPrompt(language);
    const result = await genModel.generateContent(prompt);

    await Deno.writeTextFile(
      `${BASE_PATH}/translated/${locale}.md`,
      result.response.text(),
    );

    console.log(`Translated  ${locale}(${language})`);

    console.log("Waiting 10 seconds...");

    // ManyRequestにならないよう、適当な時間待つ
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
};

main();
