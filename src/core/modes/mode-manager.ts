// src/core/modes/mode-manager.ts

import type { Mode, ModeConfig, ModesConfig } from "../../shared/types.js";
import { PLAN_MODE, PLAN_SYSTEM_PROMPT } from "../orchestrator/modes/plan.js";
import { BUILD_MODE, BUILD_SYSTEM_PROMPT } from "../orchestrator/modes/build.js";
import { YOLO_MODE, YOLO_SYSTEM_PROMPT } from "../orchestrator/modes/yolo.js";
import { DEFAULT_MODE, DEFAULT_SYSTEM_PROMPT } from "../orchestrator/modes/default.js";
import type { AgentToolDefinition } from "../orchestrator/agent-loop.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

const MODE_PROMPTS: Record<Mode, string> = {
  plan: PLAN_SYSTEM_PROMPT,
  build: BUILD_SYSTEM_PROMPT,
  yolo: YOLO_SYSTEM_PROMPT,
  default: DEFAULT_SYSTEM_PROMPT,
};

const READ_ONLY_TOOLS = new Set([
  "read",
  "read_file",
  "glob",
  "grep",
  "search",
  "list_directory",
  "get_file_info",
]);

const DESTRUCTIVE_TOOLS = new Set([
  "bash",
  "write",
  "write_file",
  "edit",
  "edit_file",
  "delete",
]);

export class ModeManager {
  private currentMode: Mode;
  private config: ModesConfig;
  private modeHistory: Array<{ mode: Mode; timestamp: Date }> = [];

  constructor(config?: Partial<ModesConfig>) {
    this.config = {
      plan: config?.plan ?? PLAN_MODE,
      build: config?.build ?? BUILD_MODE,
      yolo: config?.yolo ?? YOLO_MODE,
      default: config?.default ?? DEFAULT_MODE,
    };
    this.currentMode = "default";
    this.modeHistory.push({ mode: this.currentMode, timestamp: new Date() });
  }

  getCurrentMode(): Mode {
    return this.currentMode;
  }

  getModeConfig(mode?: Mode): ModeConfig {
    return this.config[mode ?? this.currentMode];
  }

  getSystemPrompt(mode?: Mode): string {
    const m = mode ?? this.currentMode;
    return MODE_PROMPTS[m];
  }

  switchMode(mode: Mode): void {
    if (!this.config[mode].enabled) {
      logger.warn(`Mode "${mode}" is disabled in configuration`);
      throw new Error(`Mode "${mode}" is disabled`);
    }
    const previousMode = this.currentMode;
    this.currentMode = mode;
    this.modeHistory.push({ mode, timestamp: new Date() });
    logger.info(`Switched from "${previousMode}" to "${mode}" mode`);
  }

  getHistory(): Array<{ mode: Mode; timestamp: Date }> {
    return [...this.modeHistory];
  }

  filterToolsForPlanMode(tools: AgentToolDefinition[]): AgentToolDefinition[] {
    return tools.filter((tool) => READ_ONLY_TOOLS.has(tool.name));
  }

  requiresConfirmation(toolName: string): boolean {
    if (this.currentMode === "yolo") {
      return false;
    }

    if (this.currentMode === "plan") {
      return true;
    }

    if (this.currentMode === "default") {
      return DESTRUCTIVE_TOOLS.has(toolName);
    }

    const modeConfig = this.getModeConfig();
    return modeConfig.requireConfirmation && DESTRUCTIVE_TOOLS.has(toolName);
  }

  isReadOnly(): boolean {
    return this.getModeConfig().readOnly;
  }

  canAutoExecute(): boolean {
    return this.getModeConfig().autoExecute;
  }

  getAvailableTools(tools: AgentToolDefinition[]): AgentToolDefinition[] {
    if (this.currentMode === "plan") {
      return this.filterToolsForPlanMode(tools);
    }
    return tools;
  }

  updateConfig(config: Partial<ModesConfig>): void {
    if (config.plan) this.config.plan = { ...this.config.plan, ...config.plan };
    if (config.build) this.config.build = { ...this.config.build, ...config.build };
    if (config.yolo) this.config.yolo = { ...this.config.yolo, ...config.yolo };
    if (config.default) this.config.default = { ...this.config.default, ...config.default };
  }
}
