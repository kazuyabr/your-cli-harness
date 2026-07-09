// src/core/cli/commands/delete-client.ts

import { existsSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { createLogger } from "../../../shared/logger.js";

const logger = createLogger();

export interface DeleteClientOptions {
  force?: boolean;
}

export function deleteClient(name: string, _options: DeleteClientOptions = {}): void {
  const clientDir = resolve(process.cwd(), "src", "clients", name);
  const distDir = resolve(process.cwd(), "dist", "clients", name);

  if (!existsSync(clientDir)) {
    console.log(`Client "${name}" does not exist.`);
    return;
  }

  // Remove source directory
  rmSync(clientDir, { recursive: true, force: true });
  logger.info(`Removed source: ${clientDir}`);

  // Remove dist directory if exists
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
    logger.info(`Removed dist: ${distDir}`);
  }

  // Remove bin entry from package.json
  removeBinEntry(name);

  console.log(`Client "${name}" deleted successfully.`);
}

function removeBinEntry(name: string): void {
  const packageJsonPath = resolve(process.cwd(), "package.json");

  if (!existsSync(packageJsonPath)) return;

  try {
    const content = readFileSync(packageJsonPath, "utf-8");
    const pkg = JSON.parse(content) as Record<string, unknown>;

    if (pkg.bin && typeof pkg.bin === "object") {
      const bin = pkg.bin as Record<string, string>;
      if (bin[name]) {
        delete bin[name];
        pkg.bin = bin;
        writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
        logger.info(`Removed bin entry "${name}" from package.json`);
      }
    }
  } catch (err) {
    logger.warn(`Failed to update package.json: ${err}`);
  }
}
