// src/core/cli/tui/components/SlashMenu.tsx
// Slash command menu with keyboard navigation

import { useState } from "react";
import { Box, Text, useInput } from "ink";

import type { CommandDefinition } from "../hooks/useCommands.js";

interface SlashMenuProps {
  commands: CommandDefinition[];
  filter: string;
  onSelect: (command: CommandDefinition) => void;
  onClose: () => void;
}

export function SlashMenu({ commands, filter, onSelect, onClose }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = commands.filter(
    (cmd) => cmd.name.includes(filter) || cmd.description.includes(filter)
  );

  useInput((_input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(filtered.length - 1, prev + 1));
      return;
    }

    if (key.return) {
      const selected = filtered[selectedIndex];
      if (selected) {
        onSelect(selected);
      }
      return;
    }
  });

  if (filtered.length === 0) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="yellow" paddingX={1}>
        <Text dimColor>No matching commands</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="yellow" paddingX={1}>
      <Text bold color="yellow">
        Slash Commands:
      </Text>
      {filtered.map((cmd, index) => (
        <Box key={cmd.name}>
          <Text color={index === selectedIndex ? "cyan" : "white"}>
            {index === selectedIndex ? "❯ " : "  "}
            /{cmd.name.padEnd(12)}
          </Text>
          <Text dimColor>{cmd.description}</Text>
        </Box>
      ))}
      <Box marginTop={0}>
        <Text dimColor>↑↓ Navigate · Enter Select · Esc Cancel</Text>
      </Box>
    </Box>
  );
}
