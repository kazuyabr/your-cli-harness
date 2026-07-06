// src/core/cli/tui/components/InputBar.tsx
// Input bar component with text input and slash command detection

import { useState, useCallback } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface InputBarProps {
  onSubmit: (input: string) => void;
  onSlashCommand: (command: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

export function InputBar({ onSubmit, onSlashCommand, isDisabled, placeholder }: InputBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      if (trimmed.startsWith("/")) {
        onSlashCommand(trimmed);
      } else {
        onSubmit(trimmed);
      }

      setValue("");
    },
    [onSubmit, onSlashCommand]
  );

  if (isDisabled) {
    return (
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>{"> "}</Text>
        <Text dimColor>{placeholder ?? "Processing..."}</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text>{"> "}</Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder={placeholder ?? "Type a message or /command..."}
      />
    </Box>
  );
}
