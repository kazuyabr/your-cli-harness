// src/core/cli/tui/App.tsx
// Root component for the Ink TUI

import { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";

import type { Message, StatusBarInfo, TUIOptions, TUIState } from "./types.js";

export function App({ clientName, version, language = "en" }: TUIOptions) {
  const { exit } = useApp();
  const [messages] = useState<Message[]>([]);
  const [_state] = useState<TUIState>("idle");
  const [status] = useState<StatusBarInfo>({
    model: "openrouter/owl-alpha",
    provider: "openrouter",
    tokensIn: 0,
    tokensOut: 0,
    cost: 0,
    mode: "default",
    language,
  });

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
  });

  return (
    <Box flexDirection="column" width="100%">
      {/* Header */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          {clientName} v{version}
        </Text>
      </Box>

      {/* Main content area */}
      <Box flexDirection="row" flexGrow={1}>
        {/* Chat panel */}
        <Box flexDirection="column" flexGrow={3} paddingX={1}>
          {messages.length === 0 ? (
            <Box marginTop={1}>
              <Text dimColor>
                Type a message or / for slash commands. Ctrl+C to exit.
              </Text>
            </Box>
          ) : (
            messages.map((msg) => (
              <Box key={msg.id} marginBottom={1}>
                <Text bold color={msg.role === "user" ? "green" : "cyan"}>
                  {msg.role === "user" ? "You" : "Assistant"}:{" "}
                </Text>
                <Text>{msg.content}</Text>
              </Box>
            ))
          )}
        </Box>

        {/* Status panel */}
        <Box
          flexDirection="column"
          flexGrow={1}
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
        >
          <Text bold>Model:</Text>
          <Text>{status.model}</Text>
          <Box marginTop={1} />
          <Text bold>Tokens:</Text>
          <Text> In: {status.tokensIn.toLocaleString()}</Text>
          <Text>Out: {status.tokensOut.toLocaleString()}</Text>
          <Box marginTop={1} />
          <Text bold>Cost:</Text>
          <Text> ${status.cost.toFixed(4)}</Text>
          <Box marginTop={1} />
          <Text bold>Mode:</Text>
          <Text> {status.mode}</Text>
        </Box>
      </Box>

      {/* Input area */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text>{"> "}</Text>
        <Text dimColor>Type a message or /command...</Text>
      </Box>
    </Box>
  );
}
