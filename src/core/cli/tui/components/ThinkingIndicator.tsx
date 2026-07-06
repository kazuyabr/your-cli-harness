// src/core/cli/tui/components/ThinkingIndicator.tsx
// Thinking/loading indicator with spinner

import { Box, Text } from "ink";
import Spinner from "ink-spinner";

interface ThinkingIndicatorProps {
  message?: string;
}

export function ThinkingIndicator({ message = "Thinking" }: ThinkingIndicatorProps) {
  return (
    <Box>
      <Text color="cyan">
        <Spinner type="dots" />
      </Text>
      <Text> {message}...</Text>
    </Box>
  );
}
