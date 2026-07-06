// src/core/cli/tui/components/StatusBar.tsx
// Status bar showing model, tokens, cost, mode

import { Box, Text } from "ink";

import type { StatusBarInfo } from "../types.js";

interface StatusBarProps {
  status: StatusBarInfo;
}

export function StatusBar({ status }: StatusBarProps) {
  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
    >
      <Text bold>Model:</Text>
      <Text> {status.model}</Text>

      <Box marginTop={1} />
      <Text bold>Tokens:</Text>
      <Text>
        {" "}
        In: {status.tokensIn.toLocaleString()}
      </Text>
      <Text>
        Out: {status.tokensOut.toLocaleString()}
      </Text>

      <Box marginTop={1} />
      <Text bold>Cost:</Text>
      <Text> ${status.cost.toFixed(4)}</Text>

      <Box marginTop={1} />
      <Text bold>Mode:</Text>
      <Text> {status.mode}</Text>

      <Box marginTop={1} />
      <Text bold>Lang:</Text>
      <Text> {status.language}</Text>
    </Box>
  );
}
