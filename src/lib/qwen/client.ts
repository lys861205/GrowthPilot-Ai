import { createOpenAI } from "@ai-sdk/openai";

export const qwen = createOpenAI({
  apiKey: process.env.QWEN_API_KEY ?? "",
  baseURL:
    process.env.QWEN_BASE_URL ??
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

export const QWEN_MODEL = process.env.QWEN_MODEL ?? "qwen-plus";
