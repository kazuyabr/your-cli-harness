// src/core/cli/tui/index.tsx

import React, { useState, useCallback } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { SlashCommandRegistry } from "../commands/slash/index.js";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatAppProps {
  clientName: string;
  version: string;
  language?: string;
}

const ChatApp: React.FC<ChatAppProps> = ({ clientName, version, language = "en" }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { exit } = useApp();
  
  const commandRegistry = new SlashCommandRegistry(language);

  const handleSubmit = useCallback(async (value: string) => {
    if (!value.trim()) return;

    // Add user message
    const userMessage: Message = { role: "user", content: value };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Check if it's a slash command
      if (value.startsWith("/")) {
        const result = await commandRegistry.execute(value);
        if (result) {
          const assistantMessage: Message = { role: "assistant", content: result };
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        // Regular message - simulate response
        const assistantMessage: Message = { 
          role: "assistant", 
          content: `I received your message: "${value}"\n\nThis is a placeholder response. The AgentLoop integration will be added in a future phase.` 
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: Message = { 
        role: "assistant", 
        content: `Error: ${error instanceof Error ? error.message : String(error)}` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [commandRegistry]);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {clientName} v{version}
        </Text>
      </Box>

      {/* Messages */}
      <Box flexDirection="column" marginBottom={1}>
        {messages.map((msg, index) => (
          <Box key={index} marginBottom={1}>
            <Text bold color={msg.role === "user" ? "green" : "blue"}>
              {msg.role === "user" ? "You" : "Assistant"}:{" "}
            </Text>
            <Text>{msg.content}</Text>
          </Box>
        ))}
      </Box>

      {/* Input */}
      <Box>
        <Text bold color="green">
          {">"}{" "}
        </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={isProcessing ? "Processing..." : "Type a message or /help"}
        />
      </Box>

      {/* Status */}
      <Box marginTop={1}>
        <Text dimColor>
          Press Ctrl+C to exit | Type /help for commands
        </Text>
      </Box>
    </Box>
  );
};

export interface TUIOptions {
  clientName: string;
  version: string;
  language?: string;
}

export function startTUI(options: TUIOptions): void {
  const { clientName, version, language } = options;
  
  render(
    <ChatApp 
      clientName={clientName} 
      version={version} 
      language={language} 
    />
  );
}
