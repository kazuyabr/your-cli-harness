// src/core/cli/tui/hooks/useChat.ts
// Hook for managing chat messages

import { useState, useCallback } from "react";

import type { Message, TUIState } from "../types.js";

let messageIdCounter = 0;

function generateId(): string {
  return `msg-${Date.now()}-${++messageIdCounter}`;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<TUIState>("idle");

  const addUserMessage = useCallback((content: string) => {
    const message: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const addAssistantMessage = useCallback((content: string) => {
    const message: Message = {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    const message: Message = {
      id: generateId(),
      role: "system",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const addToolMessage = useCallback((toolName: string, output: string) => {
    const message: Message = {
      id: generateId(),
      role: "tool",
      content: output,
      timestamp: new Date(),
      toolName,
      toolOutput: output,
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const updateLastMessage = useCallback((content: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last) {
        updated[updated.length - 1] = {
          id: last.id,
          role: last.role,
          content,
          timestamp: last.timestamp,
          toolName: last.toolName,
          toolOutput: last.toolOutput,
          isStreaming: last.isStreaming,
        };
      }
      return updated;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const removeLastMessage = useCallback(() => {
    setMessages((prev) => prev.slice(0, -1));
  }, []);

  return {
    messages,
    state,
    setState,
    addUserMessage,
    addAssistantMessage,
    addSystemMessage,
    addToolMessage,
    updateLastMessage,
    clearMessages,
    removeLastMessage,
  };
}
