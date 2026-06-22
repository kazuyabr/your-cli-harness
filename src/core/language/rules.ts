// src/core/language/rules.ts

import type { SupportedLanguage } from "./detector.js";

export interface LanguageRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export class LanguageRules {
  // Technical terms that should NOT be translated
  private technicalTerms: Set<string> = new Set([
    // Programming & Development
    "API", "SDK", "CLI", "URL", "HTTP", "HTTPS", "REST", "GraphQL",
    "JSON", "XML", "YAML", "HTML", "CSS", "JavaScript", "TypeScript",
    "Python", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin",
    "React", "Vue", "Angular", "Node.js", "Deno", "Bun",
    "Docker", "Kubernetes", "K8s", "AWS", "Azure", "GCP",
    "Git", "GitHub", "GitLab", "Bitbucket",
    "npm", "yarn", "pnpm", "bun",
    "VS Code", "IntelliJ", "Vim", "Neovim",
    "Linux", "Windows", "macOS", "iOS", "Android",
    
    // AI & ML
    "LLM", "GPT", "Claude", "Gemini", "Llama", "Mistral",
    "OpenAI", "Anthropic", "Google", "Meta",
    "token", "tokens", "prompt", "completion",
    "embedding", "vector", "RAG", "MCP",
    "fine-tuning", "fine-tune", "RLHF",
    
    // DevOps & Infrastructure
    "CI/CD", "CDN", "DNS", "SSL", "TLS",
    "JWT", "OAuth", "SAML", "SSO",
    "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "Kafka", "RabbitMQ", "NATS",
    
    // Tools & Platforms
    "Jira", "Confluence", "Slack", "Discord",
    "Figma", "Notion", "Trello", "Asana",
    "Sentry", "Datadog", "New Relic",
    "Vercel", "Netlify", "Railway", "Fly.io",
  ]);

  // Common abbreviations that should stay in English
  private abbreviations: Set<string> = new Set([
    "FYI", "BTW", "IMO", "IMHO", "TBH", "IDK", "IIRC",
    "PR", "MR", "RFC", "POC", "MVP", "WIP", "TODO", "FIXME",
    "AI", "ML", "DL", "NLP", "CV",
    "UX", "UI", "DX",
    "OK", "KO",
  ]);

  isTechnicalTerm(term: string): boolean {
    // Check exact match (case-sensitive)
    if (this.technicalTerms.has(term)) {
      return true;
    }

    // Check case-insensitive
    const lowerTerm = term.toLowerCase();
    for (const techTerm of this.technicalTerms) {
      if (techTerm.toLowerCase() === lowerTerm) {
        return true;
      }
    }

    return false;
  }

  isAbbreviation(term: string): boolean {
    return this.abbreviations.has(term.toUpperCase());
  }

  shouldPreserve(term: string): boolean {
    // Preserve technical terms
    if (this.isTechnicalTerm(term)) {
      return true;
    }

    // Preserve abbreviations
    if (this.isAbbreviation(term)) {
      return true;
    }

    // Preserve URLs
    if (/^https?:\/\//i.test(term)) {
      return true;
    }

    // Preserve file paths
    if (/^(\/|\\|[A-Z]:\\|~\/)/i.test(term)) {
      return true;
    }

    // Preserve code blocks
    if (/^`[^`]+`$/.test(term) || /^```/.test(term)) {
      return true;
    }

    // Preserve version numbers
    if (/^v?\d+\.\d+(\.\d+)?(-\w+)?$/.test(term)) {
      return true;
    }

    // Preserve package names (e.g., @scope/package)
    if (/^@[\w-]+\/[\w-]+$/.test(term)) {
      return true;
    }

    // Preserve environment variables
    if (/^[A-Z_][A-Z0-9_]*$/.test(term) && term.includes("_")) {
      return true;
    }

    return false;
  }

  getTechnicalTerms(): string[] {
    return Array.from(this.technicalTerms);
  }

  getAbbreviations(): string[] {
    return Array.from(this.abbreviations);
  }

  addTechnicalTerm(term: string): void {
    this.technicalTerms.add(term);
  }

  addAbbreviation(abbr: string): void {
    this.abbreviations.add(abbr.toUpperCase());
  }

  // Get a list of terms that should be preserved in a given text
  getPreservedTerms(text: string): string[] {
    const words = text.split(/\s+/);
    return words.filter(word => this.shouldPreserve(word));
  }

  // Check if a text contains any technical terms
  hasTechnicalTerms(text: string): boolean {
    const words = text.split(/\s+/);
    return words.some(word => this.isTechnicalTerm(word));
  }

  // Get language-specific rules for common patterns
  getLanguageRules(lang: SupportedLanguage): LanguageRule[] {
    const rules: Record<SupportedLanguage, LanguageRule[]> = {
      "pt-BR": [
        // Preserve English technical terms in Portuguese text
        {
          pattern: /\b(API|SDK|CLI|URL|HTTP|JSON|Git|Docker|Kubernetes)\b/g,
          replacement: "$1",
          description: "Preserve technical terms in English",
        },
      ],
      "pt-PT": [
        {
          pattern: /\b(API|SDK|CLI|URL|HTTP|JSON|Git|Docker|Kubernetes)\b/g,
          replacement: "$1",
          description: "Preserve technical terms in English",
        },
      ],
      "en": [], // No special rules for English
      "es": [
        {
          pattern: /\b(API|SDK|CLI|URL|HTTP|JSON|Git|Docker|Kubernetes)\b/g,
          replacement: "$1",
          description: "Preserve technical terms in English",
        },
      ],
      "fr": [
        {
          pattern: /\b(API|SDK|CLI|URL|HTTP|JSON|Git|Docker|Kubernetes)\b/g,
          replacement: "$1",
          description: "Preserve technical terms in English",
        },
      ],
      "de": [
        {
          pattern: /\b(API|SDK|CLI|URL|HTTP|JSON|Git|Docker|Kubernetes)\b/g,
          replacement: "$1",
          description: "Preserve technical terms in English",
        },
      ],
      "it": [
        {
          pattern: /\b(API|SDK|CLI|URL|HTTP|JSON|Git|Docker|Kubernetes)\b/g,
          replacement: "$1",
          description: "Preserve technical terms in English",
        },
      ],
      "ja": [
        {
          pattern: /\b(API|SDK|CLI|URL|HTTP|JSON|Git|Docker|Kubernetes)\b/g,
          replacement: "$1",
          description: "Preserve technical terms in English",
        },
      ],
      "zh": [
        {
          pattern: /\b(API|SDK|CLI|URL|HTTP|JSON|Git|Docker|Kubernetes)\b/g,
          replacement: "$1",
          description: "Preserve technical terms in English",
        },
      ],
      "ko": [
        {
          pattern: /\b(API|SDK|CLI|URL|HTTP|JSON|Git|Docker|Kubernetes)\b/g,
          replacement: "$1",
          description: "Preserve technical terms in English",
        },
      ],
    };

    return rules[lang] || [];
  }

  // Apply language rules to text
  applyRules(text: string, lang: SupportedLanguage): string {
    const rules = this.getLanguageRules(lang);
    let result = text;

    for (const rule of rules) {
      result = result.replace(rule.pattern, rule.replacement);
    }

    return result;
  }
}
