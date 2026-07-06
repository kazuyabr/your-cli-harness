// src/core/cli/tui/components/ChatPanel.tsx
// Chat panel component displaying messages

import { Box, Text } from "ink";

import type { Message } from "../types.js";

interface ChatPanelProps {
  messages: Message[];
  isStreaming?: boolean;
  streamedText?: string;
}

export function ChatPanel({ messages, isStreaming, streamedText }: ChatPanelProps) {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {messages.length === 0 && !isStreaming ? (
        <Box marginTop={1}>
          <Text dimColor>
            Type a message or / for slash commands. Ctrl+C to exit.
          </Text>
        </Box>
      ) : (
        <>
          {messages.map((msg) => (
            <Box key={msg.id} marginBottom={1} flexDirection="column">
              <Box>
                <Text bold color={getRoleColor(msg.role)}>
                  {getRoleLabel(msg.role)}:{" "}
                </Text>
              </Box>
              <Box paddingLeft={2}>
                <Text>{msg.content}</Text>
              </Box>
              {msg.role === "tool" && msg.toolName && (
                <Box paddingLeft={2} marginTop={0}>
                  <Text dimColor>[Tool: {msg.toolName}]</Text>
                </Box>
              )}
            </Box>
          ))}
          {isStreaming && streamedText && (
            <Box marginBottom={1} flexDirection="column">
              <Box>
                <Text bold color="cyan">
                  Assistant:{" "}
                </Text>
              </Box>
              <Box paddingLeft={2}>
                <Text>{streamedText}</Text>
                <Text color="cyan">{"|"}</Text>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

function getRoleColor(role: Message["role"]): string {
  switch (role) {
    case "user":
      return "green";
    case "assistant":
      return "cyan";
    case "system":
      return "yellow";
    case "tool":
      return "magenta";
    default:
      return "white";
  }
}

function getRoleLabel(role: Message["role"]): string {
  switch (role) {
    case "user":
      return "You";
    case "assistant":
      return "Assistant";
    case "system":
      return "System";
    case "tool":
      return "Tool";
    default:
      return role;
  }
}
