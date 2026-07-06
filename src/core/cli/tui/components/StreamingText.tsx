// src/core/cli/tui/components/StreamingText.tsx
// Streaming text display with cursor

import { Box, Text } from "ink";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  cursorColor?: string;
}

export function StreamingText({ text, isStreaming, cursorColor = "cyan" }: StreamingTextProps) {
  return (
    <Box>
      <Text>{text}</Text>
      {isStreaming && <Text color={cursorColor}>{"|"}</Text>}
    </Box>
  );
}
