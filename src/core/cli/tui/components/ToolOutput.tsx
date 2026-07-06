// src/core/cli/tui/components/ToolOutput.tsx
// Tool output display component

import { Box, Text } from "ink";

interface ToolOutputProps {
  toolName: string;
  output: string;
  isCollapsed?: boolean;
}

export function ToolOutput({ toolName, output, isCollapsed = false }: ToolOutputProps) {
  const lines = output.split("\n");
  const displayLines = isCollapsed ? lines.slice(0, 3) : lines;
  const hasMore = lines.length > 3;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1} marginBottom={1}>
      <Box>
        <Text bold color="magenta">
          🔧 {toolName}
        </Text>
        {isCollapsed && hasMore && (
          <Text dimColor> ({lines.length} lines, showing first 3)</Text>
        )}
      </Box>
      {displayLines.map((line, index) => (
        <Text key={index}> {line}</Text>
      ))}
      {isCollapsed && hasMore && (
        <Text dimColor> ... ({lines.length - 3} more lines)</Text>
      )}
    </Box>
  );
}
