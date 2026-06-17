// src/shared/errors.ts

export class HarnessError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "HarnessError";
  }
}

export class ConfigError extends HarnessError {
  constructor(message: string, cause?: Error) {
    super(message, "CONFIG_ERROR", cause);
    this.name = "ConfigError";
  }
}

export class ClientNotFoundError extends HarnessError {
  constructor(clientName: string) {
    super(`Client "${clientName}" not found`, "CLIENT_NOT_FOUND");
    this.name = "ClientNotFoundError";
  }
}

export class LLMError extends HarnessError {
  constructor(message: string, cause?: Error) {
    super(message, "LLM_ERROR", cause);
    this.name = "LLMError";
  }
}

export class MCPError extends HarnessError {
  constructor(message: string, cause?: Error) {
    super(message, "MCP_ERROR", cause);
    this.name = "MCPError";
  }
}

export class SkillError extends HarnessError {
  constructor(message: string, cause?: Error) {
    super(message, "SKILL_ERROR", cause);
    this.name = "SkillError";
  }
}

export class MemoryError extends HarnessError {
  constructor(message: string, cause?: Error) {
    super(message, "MEMORY_ERROR", cause);
    this.name = "MemoryError";
  }
}
