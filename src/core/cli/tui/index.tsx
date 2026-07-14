// src/core/cli/tui/index.tsx
// Entry point for the Ink-based TUI

import { render } from "ink";

import { App } from "./App.js";
import type { TUIOptions } from "./types.js";

export type { TUIOptions };

export function startTUI(options: TUIOptions): void {
  const { clientName, version, language = "en", theme = "professional", logo } = options;

  render(
    <App
      clientName={clientName}
      version={version}
      language={language}
      theme={theme}
      logo={logo}
    />
  );
}
