// src/core/cli/commands/onboarding.ts

import * as readline from "node:readline";
import chalk from "chalk";
import { createClient } from "./create-client.js";

export interface OnboardingAnswers {
  clientName: string;
  commandName: string;
  llmProvider: "anthropic" | "openai" | "azure";
  model: string;
  planEnabled: boolean;
  planCanPropose: boolean;
  planCanExecute: boolean;
  buildEnabled: boolean;
  buildWithTests: boolean;
  buildWithDeploy: boolean;
  yoloEnabled: boolean;
  yoloConfirmDestructive: boolean;
  autoMemory: boolean;
  vectorEnabled: boolean;
  vectorProvider: "qdrant" | "pinecone" | "none";
  qdrantUrl: string;
  mcpGitHub: boolean;
  mcpJira: boolean;
  mcpDatabase: boolean;
  brandingVoice: "professional" | "casual" | "technical";
  customLogo: boolean;
  customColors: boolean;
}

const MODEL_MAP: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-3-20240307"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  azure: ["gpt-4o", "gpt-4-turbo", "gpt-35-turbo"],
};

function createPrompt(rl: readline.Interface): {
  question: (prompt: string) => Promise<string>;
  confirm: (prompt: string, defaultYes?: boolean) => Promise<boolean>;
  select: <T extends string>(prompt: string, options: T[], defaultVal?: T) => Promise<T>;
  close: () => void;
} {
  return {
    question: (prompt: string) =>
      new Promise<string>((resolve) => {
        rl.question(prompt, (answer) => resolve(answer.trim()));
      }),
    confirm: async (prompt: string, defaultYes = true) => {
      const suffix = defaultYes ? "(Y/n)" : "(y/N)";
      const answer = await new Promise<string>((resolve) => {
        rl.question(`${chalk.cyan("?")} ${prompt} ${chalk.gray(suffix)} `, (a) => resolve(a.trim().toLowerCase()));
      });
      if (answer === "") return defaultYes;
      return answer === "y" || answer === "yes";
    },
    select: async <T extends string>(prompt: string, options: T[], defaultVal?: T) => {
      console.log(chalk.cyan(`? ${prompt}`));
      for (let i = 0; i < options.length; i++) {
        const prefix = i === 0 ? "❯" : " ";
        const marker = options[i] === defaultVal ? chalk.gray(" (default)") : "";
        console.log(`  ${prefix} ${options[i]}${marker}`);
      }
      const answer = await new Promise<string>((resolve) => {
        rl.question(chalk.gray("  Enter choice: "), (a) => resolve(a.trim().toLowerCase()));
      });
      if (answer === "" && defaultVal) return defaultVal;
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < options.length) return options[idx]!;
      if (options.includes(answer as T)) return answer as T;
      return defaultVal ?? options[0]!;
    },
    close: () => rl.close(),
  };
}

export async function runOnboarding(): Promise<OnboardingAnswers> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const p = createPrompt(rl);

  console.log(chalk.bold.cyan("\n🎯 YOUR CLI HARNESS - Setup Inicial\n"));
  console.log(chalk.gray("Answer the questions below to configure your CLI.\n"));

  // --- Basic Info ---
  console.log(chalk.bold("\n📋 BÁSICO\n"));

  const clientName = await p.question(
    `${chalk.cyan("?")} Nome da sua CLI (ex: jogatinando): `,
  );
  if (!clientName) {
    p.close();
    throw new Error("Client name is required");
  }

  const commandName = await p.question(
    `${chalk.cyan("?")} Comando de execução [${clientName}]: `,
  );
  const finalCommand = commandName || clientName;

  // --- LLM ---
  console.log(chalk.bold("\n🧠 LLM\n"));

  const llmProvider = await p.select("Provedor LLM principal:", ["anthropic", "openai", "azure"], "anthropic");
  const models = MODEL_MAP[llmProvider]!;
  const model = await p.select("Modelo padrão:", models, models[0]!);

  // --- Modes ---
  console.log(chalk.bold("\n⚙️  MODOS\n"));

  const planEnabled = await p.confirm("Ativar modo Plan?", true);
  let planCanPropose = true;
  let planCanExecute = false;
  if (planEnabled) {
    planCanPropose = await p.confirm("  O modo Plan pode propor mudanças?", true);
    planCanExecute = await p.confirm("  O modo Plan pode executar mudanças?", false);
  }

  const buildEnabled = await p.confirm("Ativar modo Build?", true);
  let buildWithTests = true;
  let buildWithDeploy = false;
  if (buildEnabled) {
    buildWithTests = await p.confirm("  Build inclui testes automáticos?", true);
    buildWithDeploy = await p.confirm("  Build inclui deploy?", false);
  }

  const yoloEnabled = await p.confirm("Ativar modo YOLO?", false);
  let yoloConfirmDestructive = true;
  if (yoloEnabled) {
    yoloConfirmDestructive = await p.confirm("  YOLO requer confirmação para ações destrutivas?", true);
  }

  // --- Memory ---
  console.log(chalk.bold("\n🧠 MEMÓRIA\n"));

  const autoMemory = await p.confirm("Usar memória automática?", true);
  const vectorEnabled = await p.confirm("Indexar documentos corporativos?", false);
  let vectorProvider: "qdrant" | "pinecone" | "none" = "none";
  let qdrantUrl = "";
  if (vectorEnabled) {
    vectorProvider = await p.select("Provedor vetorial:", ["qdrant", "pinecone", "none"], "qdrant");
    if (vectorProvider === "qdrant") {
      qdrantUrl = await p.question(`${chalk.cyan("?")} URL do Qdrant [http://localhost:6333]: `);
      if (!qdrantUrl) qdrantUrl = "http://localhost:6333";
    }
  }

  // --- MCP ---
  console.log(chalk.bold("\n🔌 MCP\n"));

  const mcpGitHub = await p.confirm("Conectar GitHub?", true);
  const mcpJira = await p.confirm("Conectar Jira?", false);
  const mcpDatabase = await p.confirm("Conectar banco de dados?", false);

  // --- Branding ---
  console.log(chalk.bold("\n🎨 BRANDING\n"));

  const brandingVoice = await p.select("Tom de voz:", ["professional", "casual", "technical"], "professional");
  const customLogo = await p.confirm("Logo ASCII customizada?", false);
  const customColors = await p.confirm("Cores customizadas?", false);

  p.close();

  const answers: OnboardingAnswers = {
    clientName,
    commandName: finalCommand,
    llmProvider,
    model,
    planEnabled,
    planCanPropose,
    planCanExecute,
    buildEnabled,
    buildWithTests,
    buildWithDeploy,
    yoloEnabled,
    yoloConfirmDestructive,
    autoMemory,
    vectorEnabled,
    vectorProvider,
    qdrantUrl,
    mcpGitHub,
    mcpJira,
    mcpDatabase,
    brandingVoice,
    customLogo,
    customColors,
  };

  return answers;
}

export function generateConfigFromAnswers(answers: OnboardingAnswers): string {
  const sections: string[] = [];

  sections.push(`name: ${answers.clientName}`);
  sections.push(`command: ${answers.commandName}`);
  sections.push(`version: "1.0.0"`);
  sections.push("");

  // LLM
  sections.push(`llm:`);
  sections.push(`  provider: ${answers.llmProvider}`);
  sections.push(`  model: ${answers.model}`);
  sections.push(`  maxTokens: 8096`);
  sections.push(`  temperature: 0.7`);
  sections.push("");

  // Modes
  sections.push(`modes:`);
  sections.push(`  default:`);
  sections.push(`    enabled: true`);
  if (answers.planEnabled) {
    sections.push(`  plan:`);
    sections.push(`    enabled: true`);
    sections.push(`    canPropose: ${answers.planCanPropose}`);
    sections.push(`    canExecute: ${answers.planCanExecute}`);
  }
  if (answers.buildEnabled) {
    sections.push(`  build:`);
    sections.push(`    enabled: true`);
    sections.push(`    withTests: ${answers.buildWithTests}`);
    sections.push(`    withDeploy: ${answers.buildWithDeploy}`);
  }
  if (answers.yoloEnabled) {
    sections.push(`  yolo:`);
    sections.push(`    enabled: true`);
    sections.push(`    confirmDestructive: ${answers.yoloConfirmDestructive}`);
  }
  sections.push("");

  // Memory
  sections.push(`memory:`);
  sections.push(`  auto:`);
  sections.push(`    enabled: ${answers.autoMemory}`);
  sections.push(`    maxLines: 200`);
  sections.push(`    maxKB: 25`);
  if (answers.vectorEnabled) {
    sections.push(`  vector:`);
    sections.push(`    provider: ${answers.vectorProvider}`);
    if (answers.vectorProvider === "qdrant") {
      sections.push(`    qdrant:`);
      sections.push(`      url: "${answers.qdrantUrl}"`);
      sections.push(`      collection: "${answers.clientName}-docs"`);
    }
  }
  sections.push("");

  // MCP
  sections.push(`mcp:`);
  sections.push(`  servers:`);
  if (answers.mcpGitHub) {
    sections.push(`    github:`);
    sections.push(`      type: http`);
    sections.push(`      url: "https://api.githubcopilot.com/mcp/"`);
  }
  if (answers.mcpJira) {
    sections.push(`    jira:`);
    sections.push(`      type: http`);
    sections.push(`      url: "https://mcp.atlassian.com/mcp"`);
  }
  if (answers.mcpDatabase) {
    sections.push(`    database:`);
    sections.push(`      type: stdio`);
    sections.push(`      command: npx`);
    sections.push(`      args: ["-y", "@your-harness/sqlite-mcp"]`);
  }
  sections.push("");

  // Branding
  sections.push(`branding:`);
  sections.push(`  theme: ${answers.brandingVoice}`);
  sections.push(`  colors:`);
  sections.push(`    primary: "#D97757"`);
  sections.push(`    secondary: "#6B7280"`);
  sections.push(`    accent: "#2563EB"`);
  sections.push(`    error: "#EF4444"`);
  sections.push(`    success: "#10B981"`);

  return sections.join("\n");
}

export async function runOnboardingAndCreate(): Promise<void> {
  const answers = await runOnboarding();
  const config = generateConfigFromAnswers(answers);

  createClient(answers.clientName);

  const { writeFileSync } = await import("node:fs");
  const { resolve: r } = await import("node:path");
  const clientDir = r(process.cwd(), "src", "clients", answers.clientName);
  writeFileSync(r(clientDir, "config.yaml"), config, "utf-8");

  console.log(chalk.green(`\n✅ Cliente "${answers.clientName}" criado com sucesso!`));
  console.log("");
  console.log("Próximos passos:");
  console.log(`  1. Execute: harness build-client ${answers.clientName}`);
  console.log(`  2. Customize o config.yaml em src/clients/${answers.clientName}/config.yaml`);
  console.log(`  3. Adicione skills em src/clients/${answers.clientName}/skills/`);
}
