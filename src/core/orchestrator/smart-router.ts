// src/core/orchestrator/smart-router.ts

import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export type OrchestrationMode = "manual" | "automatic" | "hybrid";

export interface RoutingDecision {
  provider: string;
  model: string;
  reason: string;
  confidence: number;
}

export interface RoutingCriteria {
  taskType: "code" | "chat" | "analysis" | "creative" | "simple";
  complexity: "low" | "medium" | "high";
  maxCost?: number;
  maxLatency?: number;
  preferredProvider?: string;
}

export interface ModelProfile {
  provider: string;
  model: string;
  strengths: string[];
  costPer1k: number;
  avgLatency: number;
  maxTokens: number;
}

export class SmartRouter {
  private mode: OrchestrationMode;
  private modelProfiles: ModelProfile[];
  private manualRules: Map<string, string> = new Map();

  constructor(mode: OrchestrationMode = "automatic") {
    this.mode = mode;
    this.modelProfiles = this.getDefaultProfiles();
    this.loadManualRules();
  }

  private getDefaultProfiles(): ModelProfile[] {
    return [
      {
        provider: "openrouter",
        model: "openrouter/owl-alpha",
        strengths: ["code", "chat", "analysis"],
        costPer1k: 0.0001,
        avgLatency: 500,
        maxTokens: 4096,
      },
      {
        provider: "openrouter",
        model: "meta-llama/llama-3.1-8b-instruct:free",
        strengths: ["simple", "chat"],
        costPer1k: 0,
        avgLatency: 300,
        maxTokens: 4096,
      },
      {
        provider: "groq",
        model: "llama-3.1-8b-instant",
        strengths: ["simple", "chat"],
        costPer1k: 0.00005,
        avgLatency: 200,
        maxTokens: 4096,
      },
      {
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        strengths: ["code", "analysis", "creative"],
        costPer1k: 0.003,
        avgLatency: 1000,
        maxTokens: 8192,
      },
      {
        provider: "openai",
        model: "gpt-4o",
        strengths: ["code", "chat", "creative"],
        costPer1k: 0.0025,
        avgLatency: 800,
        maxTokens: 4096,
      },
    ];
  }

  private loadManualRules(): void {
    // Default manual rules
    this.manualRules.set("code", "openrouter/openrouter/owl-alpha");
    this.manualRules.set("chat", "openrouter/openrouter/owl-alpha");
    this.manualRules.set("analysis", "openrouter/openrouter/owl-alpha");
    this.manualRules.set("creative", "anthropic/claude-sonnet-4-20250514");
    this.manualRules.set("simple", "groq/llama-3.1-8b-instant");
  }

  async route(criteria: RoutingCriteria): Promise<RoutingDecision> {
    logger.info(`Routing with mode: ${this.mode}, task: ${criteria.taskType}`);

    switch (this.mode) {
      case "manual":
        return this.routeManual(criteria);
      case "automatic":
        return this.routeAutomatic(criteria);
      case "hybrid":
        return this.routeHybrid(criteria);
      default:
        return this.routeAutomatic(criteria);
    }
  }

  private routeManual(criteria: RoutingCriteria): RoutingDecision {
    const ruleKey = criteria.taskType;
    const rule = this.manualRules.get(ruleKey);

    if (rule) {
      const [provider, model] = rule.split("/");
      return {
        provider: provider || "openrouter",
        model: model || "openrouter/owl-alpha",
        reason: `Manual rule for ${ruleKey}`,
        confidence: 1.0,
      };
    }

    // Fallback to default
    return {
      provider: "openrouter",
      model: "openrouter/owl-alpha",
      reason: "Fallback to default model",
      confidence: 0.5,
    };
  }

  private routeAutomatic(criteria: RoutingCriteria): RoutingDecision {
    // Score each model based on criteria
    const scores = this.modelProfiles.map(profile => {
      let score = 0;

      // Task type match
      if (profile.strengths.includes(criteria.taskType)) {
        score += 30;
      }

      // Complexity match
      if (criteria.complexity === "high" && profile.maxTokens >= 8192) {
        score += 20;
      } else if (criteria.complexity === "medium" && profile.maxTokens >= 4096) {
        score += 15;
      } else if (criteria.complexity === "low") {
        score += 10;
      }

      // Cost preference
      if (criteria.maxCost) {
        if (profile.costPer1k <= criteria.maxCost) {
          score += 25;
        } else {
          score -= 20;
        }
      } else {
        // Lower cost is better
        score += Math.max(0, 20 - (profile.costPer1k * 1000));
      }

      // Latency preference
      if (criteria.maxLatency) {
        if (profile.avgLatency <= criteria.maxLatency) {
          score += 15;
        } else {
          score -= 10;
        }
      } else {
        // Lower latency is better
        score += Math.max(0, 15 - (profile.avgLatency / 100));
      }

      // Provider preference
      if (criteria.preferredProvider && profile.provider === criteria.preferredProvider) {
        score += 20;
      }

      return { profile, score };
    });

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // Return best match
    const best = scores[0];
    if (!best) {
      return {
        provider: "openrouter",
        model: "openrouter/owl-alpha",
        reason: "Fallback: no models available",
        confidence: 0.3,
      };
    }

    const confidence = Math.min(1.0, best.score / 100);
    return {
      provider: best.profile.provider,
      model: best.profile.model,
      reason: `Automatic selection: ${best.profile.strengths.join(", ")}`,
      confidence,
    };
  }

  private routeHybrid(criteria: RoutingCriteria): RoutingDecision {
    // Try manual first
    const manualResult = this.routeManual(criteria);
    
    // If manual has high confidence, use it
    if (manualResult.confidence >= 0.8) {
      return manualResult;
    }

    // Otherwise, use automatic
    const automaticResult = this.routeAutomatic(criteria);
    
    // Blend confidence
    return {
      ...automaticResult,
      reason: `Hybrid: ${automaticResult.reason} (manual confidence: ${manualResult.confidence.toFixed(2)})`,
      confidence: (manualResult.confidence + automaticResult.confidence) / 2,
    };
  }

  setMode(mode: OrchestrationMode): void {
    this.mode = mode;
    logger.info(`Orchestration mode changed to: ${mode}`);
  }

  getMode(): OrchestrationMode {
    return this.mode;
  }

  setManualRule(taskType: string, providerModel: string): void {
    this.manualRules.set(taskType, providerModel);
    logger.info(`Manual rule set: ${taskType} -> ${providerModel}`);
  }

  getManualRules(): Map<string, string> {
    return new Map(this.manualRules);
  }

  addModelProfile(profile: ModelProfile): void {
    this.modelProfiles.push(profile);
    logger.info(`Model profile added: ${profile.provider}/${profile.model}`);
  }

  getModelProfiles(): ModelProfile[] {
    return [...this.modelProfiles];
  }

  getDecisionLog(): Array<{ criteria: RoutingCriteria; decision: RoutingDecision; timestamp: Date }> {
    // In a real implementation, this would return logged decisions
    return [];
  }
}
