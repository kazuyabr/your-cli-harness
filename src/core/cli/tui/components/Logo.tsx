// src/core/cli/tui/components/Logo.tsx
// Logo component using FIGlet output

import { Box, Text } from "ink";

interface LogoProps {
  logo?: string;
  clientName: string;
}

export function Logo({ logo, clientName }: LogoProps) {
  if (logo) {
    return (
      <Box flexDirection="column">
        <Text color="cyan">{logo}</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="double" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">
        {clientName}
      </Text>
    </Box>
  );
}
