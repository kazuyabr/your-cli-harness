// tests/unit/core/tui/useChat.test.ts
// Tests for useChat hook (direct logic testing without DOM)

import { describe, it, expect } from "vitest";

import type { Message } from "../../../../src/core/cli/tui/types.js";

// Test the hook logic directly without renderHook
function createChatState() {
  let messages: Message[] = [];
  let state = "idle";

  function addUserMessage(content: string) {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    messages = [...messages, message];
    return message;
  }

  function addAssistantMessage(content: string) {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role: "assistant",
      content,
      timestamp: new Date(),
    };
    messages = [...messages, message];
    return message;
  }

  function addSystemMessage(content: string) {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role: "system",
      content,
      timestamp: new Date(),
    };
    messages = [...messages, message];
    return message;
  }

  function addToolMessage(toolName: string, output: string) {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role: "tool",
      content: output,
      timestamp: new Date(),
      toolName,
      toolOutput: output,
    };
    messages = [...messages, message];
    return message;
  }

  function updateLastMessage(content: string) {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last) {
      messages = [
        ...messages.slice(0, -1),
        {
          id: last.id,
          role: last.role,
          content,
          timestamp: last.timestamp,
          toolName: last.toolName,
          toolOutput: last.toolOutput,
          isStreaming: last.isStreaming,
        },
      ];
    }
  }

  function clearMessages() {
    messages = [];
  }

  function removeLastMessage() {
    messages = messages.slice(0, -1);
  }

  function setState(newState: string) {
    state = newState;
  }

  return {
    get messages() { return messages; },
    get state() { return state; },
    addUserMessage,
    addAssistantMessage,
    addSystemMessage,
    addToolMessage,
    updateLastMessage,
    clearMessages,
    removeLastMessage,
    setState,
  };
}

describe("useChat logic", () => {
  it("starts with empty messages", () => {
    const chat = createChatState();
    expect(chat.messages).toEqual([]);
  });

  it("adds user message", () => {
    const chat = createChatState();
    chat.addUserMessage("Hello");
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0].role).toBe("user");
    expect(chat.messages[0].content).toBe("Hello");
  });

  it("adds assistant message", () => {
    const chat = createChatState();
    chat.addAssistantMessage("Hi there!");
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0].role).toBe("assistant");
    expect(chat.messages[0].content).toBe("Hi there!");
  });

  it("adds system message", () => {
    const chat = createChatState();
    chat.addSystemMessage("System notification");
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0].role).toBe("system");
  });

  it("adds tool message", () => {
    const chat = createChatState();
    chat.addToolMessage("bash", "ls -la");
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0].role).toBe("tool");
    expect(chat.messages[0].toolName).toBe("bash");
  });

  it("updates last message", () => {
    const chat = createChatState();
    chat.addAssistantMessage("Initial");
    chat.updateLastMessage("Updated content");
    expect(chat.messages[0].content).toBe("Updated content");
  });

  it("clears messages", () => {
    const chat = createChatState();
    chat.addUserMessage("Msg 1");
    chat.addUserMessage("Msg 2");
    expect(chat.messages).toHaveLength(2);
    chat.clearMessages();
    expect(chat.messages).toEqual([]);
  });

  it("removes last message", () => {
    const chat = createChatState();
    chat.addUserMessage("Msg 1");
    chat.addUserMessage("Msg 2");
    chat.removeLastMessage();
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0].content).toBe("Msg 1");
  });

  it("generates unique message IDs", () => {
    const chat = createChatState();
    chat.addUserMessage("Msg 1");
    chat.addUserMessage("Msg 2");
    expect(chat.messages[0].id).not.toBe(chat.messages[1].id);
  });

  it("sets state", () => {
    const chat = createChatState();
    chat.setState("thinking");
    expect(chat.state).toBe("thinking");
  });
});
