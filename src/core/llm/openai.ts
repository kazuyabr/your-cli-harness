// src/core/llm/openai.ts

import OpenAI from "openai";

import type { Message } from "../../shared/types.js";
import type { LLMProvider, LLMResponse } from "./provider.js";
import { LLMError } from "../../shared/errors.js";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  readonly model: string;
  private client: OpenAI;

  constructor(model: string = "gpt-4o", apiKey?: string, baseURL?: string) {
    this.model = model;
    this.client = new OpenAI({
      apiKey: apiKey ?? process.env.OPENAI_API_KEY,
      baseURL,
    });
  }

  async chat(messages: Message[], systemPrompt: string): Promise<LLMResponse> {
    try {
      const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages
          .filter((m) => m.role !== "system")
          .map((m): OpenAI.ChatCompletionMessageParam => {
            if (m.role === "tool") {
              return {
                role: "tool",
                content: m.content,
                tool_call_id: m.toolCallId ?? "",
              };
            }
            return {
              role: m.role as "user" | "assistant",
              content: m.content,
            };
          }),
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        max_tokens: 8192,
      });

      const choice = response.choices[0];
      if (!choice) {
        return {
          content: "",
          usage: { inputTokens: 0, outputTokens: 0 },
        };
      }

      return {
        content: choice.message.content ?? "",
        usage: {
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      throw new LLMError(`OpenAI API error: ${err}`, err as Error);
    }
  }

  async *stream(messages: Message[], systemPrompt: string): AsyncGenerator<string> {
    try {
      const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages
          .filter((m) => m.role !== "system")
          .map((m): OpenAI.ChatCompletionMessageParam => {
            if (m.role === "tool") {
              return {
                role: "tool",
                content: m.content,
                tool_call_id: m.toolCallId ?? "",
              };
            }
            return {
              role: m.role as "user" | "assistant",
              content: m.content,
            };
          }),
      ];

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        max_tokens: 8192,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    } catch (err) {
      throw new LLMError(`OpenAI stream error: ${err}`, err as Error);
    }
  }
}
