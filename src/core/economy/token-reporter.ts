// src/core/economy/token-reporter.ts

import { CostCalculator } from "./cost-calculator.js";

export interface InteractionReport {
  // Input
  inputTokensOriginal: number;
  inputTokensCompressed: number;
  inputTechniques: string[];
  
  // Output
  outputTokensOriginal: number;
  outputTokensCompressed: number;
  outputTechniques: string[];
  
  // Model info
  provider: string;
  model: string;
}

export interface SessionStats {
  totalInteractions: number;
  totalCostBefore: number;
  totalCostAfter: number;
  totalSaved: number;
  totalPercentSaved: number;
  interactions: InteractionReport[];
}

export class TokenReporter {
  private costCalculator: CostCalculator;
  private sessionStats: SessionStats;

  constructor() {
    this.costCalculator = new CostCalculator();
    this.sessionStats = {
      totalInteractions: 0,
      totalCostBefore: 0,
      totalCostAfter: 0,
      totalSaved: 0,
      totalPercentSaved: 0,
      interactions: [],
    };
  }

  formatInteractionReport(report: InteractionReport): string {
    const savings = this.costCalculator.calculateSavings(
      { input: report.inputTokensOriginal, output: report.outputTokensOriginal },
      { input: report.inputTokensCompressed, output: report.outputTokensCompressed },
      report.provider,
      report.model
    );

    const inputSaved = report.inputTokensOriginal - report.inputTokensCompressed;
    const outputSaved = report.outputTokensOriginal - report.outputTokensCompressed;

    // Compact format (style OpenCode)
    return [
      "",
      `📊 $${savings.costAfter.total.toFixed(4)} | -${savings.percentSaved.toFixed(0)}% | ${report.model}`,
      `   In: ${report.inputTokensCompressed.toLocaleString()} (-${inputSaved.toLocaleString()}) | Out: ${report.outputTokensCompressed.toLocaleString()} (-${outputSaved.toLocaleString()})`,
    ].join("\n");
  }

  recordInteraction(report: InteractionReport): void {
    const savings = this.costCalculator.calculateSavings(
      { input: report.inputTokensOriginal, output: report.outputTokensOriginal },
      { input: report.inputTokensCompressed, output: report.outputTokensCompressed },
      report.provider,
      report.model
    );

    this.sessionStats.totalInteractions++;
    this.sessionStats.totalCostBefore += savings.costBefore.total;
    this.sessionStats.totalCostAfter += savings.costAfter.total;
    this.sessionStats.totalSaved += savings.saved;
    this.sessionStats.totalPercentSaved = this.sessionStats.totalCostBefore > 0
      ? (this.sessionStats.totalSaved / this.sessionStats.totalCostBefore) * 100
      : 0;
    this.sessionStats.interactions.push(report);
  }

  getSessionStats(): SessionStats {
    return { ...this.sessionStats };
  }

  formatSessionReport(): string {
    const stats = this.getSessionStats();
    
    if (stats.totalInteractions === 0) {
      return "📊 Nenhuma interação registrada nesta sessão.";
    }

    return [
      "📊 Relatório de Economia de Tokens",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "📈 Resumo da Sessão:",
      `  • Interações: ${stats.totalInteractions}`,
      `  • Custo total (original): $${stats.totalCostBefore.toFixed(4)}`,
      `  • Custo total (final): $${stats.totalCostAfter.toFixed(4)}`,
      `  • Total economizado: $${stats.totalSaved.toFixed(4)} (${stats.totalPercentSaved.toFixed(0)}%)`,
      "",
      "🔧 Técnicas Aplicadas:",
      "  • Headroom (input compression): 60-95% de redução",
      "  • Caveman (output compression): 65-75% de redução",
      "",
      "💡 Dica: Use /economy --off para desligar compressão",
      "    e ver os custos originais.",
    ].join("\n");
  }

  resetSession(): void {
    this.sessionStats = {
      totalInteractions: 0,
      totalCostBefore: 0,
      totalCostAfter: 0,
      totalSaved: 0,
      totalPercentSaved: 0,
      interactions: [],
    };
  }
}
