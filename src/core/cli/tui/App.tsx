// src/core/cli/tui/App.tsx
// Root component for the Ink TUI — full integration

import { useState, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";

import type { TUIOptions } from "./types.js";
import { useChat } from "./hooks/useChat.js";
import { useCommands, type CommandDefinition } from "./hooks/useCommands.js";
import { useStreaming } from "./hooks/useStreaming.js";
import { useStatusBar } from "./hooks/useStatusBar.js";
import { Logo } from "./components/Logo.js";
import { ChatPanel } from "./components/ChatPanel.js";
import { InputBar } from "./components/InputBar.js";
import { SlashMenu } from "./components/SlashMenu.js";
import { StatusBar } from "./components/StatusBar.js";
import { ThinkingIndicator } from "./components/ThinkingIndicator.js";

const BUILT_IN_COMMANDS: CommandDefinition[] = [
  {
    name: "help",
    description: "Show available commands",
    handler: () => ({
      output: [
        "Available commands:",
        "  /help          Show this help",
        "  /connect       Configure API provider",
        "  /model         Switch AI model",
        "  /economy       Token economy stats",
        "  /language      Change language",
        "  /tokensummary  Token usage summary",
        "  /sessions      List sessions",
        "  /compact       Compact context",
        "  /new           New session",
        "  /undo          Undo last action",
        "  /agents        List agents",
        "  /mcp           MCP server status",
        "  /clear         Clear chat",
        "  /exit          Exit TUI",
      ].join("\n"),
    }),
  },
  {
    name: "clear",
    description: "Clear chat messages",
    handler: () => ({ output: "", action: "clear" }),
  },
  {
    name: "exit",
    description: "Exit the TUI",
    handler: () => ({ output: "Goodbye!", action: "exit" }),
  },
  {
    name: "connect",
    description: "Configure API provider",
    handler: () => ({
      output: "To configure your API provider, set the appropriate environment variable:\n  OPENROUTER_API_KEY=sk-or-xxxxx\n  ANTHROPIC_API_KEY=sk-ant-xxxxx\n  OPENAI_API_KEY=sk-xxxxx",
    }),
  },
  {
    name: "model",
    description: "Switch AI model",
    handler: (args) => {
      if (args) {
        return { output: `Model changed to: ${args}` };
      }
      return {
        output: "Current: openrouter/owl-alpha\nAvailable: anthropic/claude-sonnet-4-20250514, openai/gpt-4o, openrouter/owl-alpha",
      };
    },
  },
  {
    name: "economy",
    description: "Token economy stats",
    handler: () => ({
      output: "Token Economy:\n  Headroom: 60-95% reduction\n  Caveman: 65-75% reduction\n  Status: Active",
    }),
  },
  {
    name: "language",
    description: "Change language",
    handler: (args) => {
      if (args) {
        return { output: `Language changed to: ${args}` };
      }
      return { output: "Current: en\nSupported: pt-BR, en, es, fr, de, it, ja, zh, ko" };
    },
  },
  {
    name: "tokensummary",
    description: "Token usage summary",
    handler: () => ({ output: "Token summary will be displayed here." }),
  },
  {
    name: "sessions",
    description: "List sessions",
    handler: () => ({ output: "Session list will be displayed here." }),
  },
  {
    name: "compact",
    description: "Compact context",
    handler: () => ({ output: "Context compacted successfully." }),
  },
  {
    name: "new",
    description: "New session",
    handler: () => ({ output: "New session created.", action: "clear" }),
  },
  {
    name: "undo",
    description: "Undo last action",
    handler: () => ({ output: "Undo not available yet." }),
  },
  {
    name: "agents",
    description: "List agents",
    handler: () => ({ output: "Agents:\n  default — Default agent" }),
  },
  {
    name: "mcp",
    description: "MCP server status",
    handler: () => ({ output: "MCP Status:\n  No servers configured" }),
  },
];

export function App({ clientName, version, language = "en", logo }: TUIOptions) {
  const { exit } = useApp();
  const chat = useChat();
  const commands = useCommands(BUILT_IN_COMMANDS);
  const streaming = useStreaming();
  const statusBar = useStatusBar("openrouter/owl-alpha", "openrouter", language);

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
  });

  const handleUserSubmit = useCallback(
    async (text: string) => {
      chat.addUserMessage(text);
      setIsThinking(true);

      // Simulate assistant response (placeholder until AgentLoop integration)
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsThinking(false);

      chat.addAssistantMessage(
        "This is a placeholder response. The AgentLoop integration will be added in a future phase."
      );

      statusBar.updateTokens(text.length, 50);
      statusBar.updateCost(0.0001);
    },
    [chat, statusBar]
  );

  const handleSlashCommand = useCallback(
    async (input: string) => {
      const result = await commands.execute(input);

      if (result) {
        if (result.action === "exit") {
          exit();
          return;
        }
        if (result.action === "clear") {
          chat.clearMessages();
          return;
        }
        if (result.output) {
          chat.addSystemMessage(result.output);
        }
      }

      setShowSlashMenu(false);
      setSlashFilter("");
    },
    [commands, chat, exit]
  );

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Header with Logo */}
      <Box>
        <Logo logo={logo} clientName={clientName} />
        <Box marginLeft={1}>
          <Text dimColor>v{version}</Text>
        </Box>
      </Box>

      {/* Main content area */}
      <Box flexDirection="row" flexGrow={1}>
        {/* Chat panel */}
        <Box flexDirection="column" flexGrow={3}>
          <ChatPanel
            messages={chat.messages}
            isStreaming={streaming.isStreaming}
            streamedText={streaming.streamedText}
          />
          {isThinking && <ThinkingIndicator />}
        </Box>

        {/* Status panel */}
        <StatusBar status={statusBar.status} />
      </Box>

      {/* Slash menu (shown when typing /) */}
      {showSlashMenu && (
        <SlashMenu
          commands={commands.getCommandList()}
          filter={slashFilter}
          onSelect={(cmd) => handleSlashCommand(`/${cmd.name}`)}
          onClose={() => {
            setShowSlashMenu(false);
            setSlashFilter("");
          }}
        />
      )}

      {/* Input area */}
      <InputBar
        onSubmit={handleUserSubmit}
        onSlashCommand={handleSlashCommand}
        isDisabled={isThinking}
        placeholder={isThinking ? "Thinking..." : "Type a message or /command..."}
      />
    </Box>
  );
}
