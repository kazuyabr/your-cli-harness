// src/core/skills/invoker.ts

import type {
  Skill,
  SkillInvocation,
  SkillInvocationContext,
  SkillInvocationResult,
} from "../../shared/types.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export class SkillInvoker {
  invoke(skill: Skill, invocation: SkillInvocation): SkillInvocationResult {
    const startTime = Date.now();

    try {
      logger.info(`Invoking skill: ${skill.name}`);

      let content = skill.content;

      content = this.substituteArguments(content, invocation.arguments);
      content = this.substituteContext(content, invocation.context);

      const duration = Date.now() - startTime;

      return {
        success: true,
        content,
        duration,
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        content: "",
        error: String(err),
        duration,
      };
    }
  }

  invokeWithTimeout(
    skill: Skill,
    invocation: SkillInvocation,
    timeout: number = 30000
  ): Promise<SkillInvocationResult> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          content: "",
          error: `Skill "${skill.name}" timed out after ${timeout}ms`,
          duration: timeout,
        });
      }, timeout);

      const result = this.invoke(skill, invocation);
      clearTimeout(timeoutId);
      resolve(result);
    });
  }

  private substituteArguments(content: string, args: Record<string, string>): string {
    let result = content;

    result = result.replace(/\$ARGUMENTS/g, Object.values(args).join(" "));

    result = result.replace(/\$ARGUMENTS\[(\d+)\]/g, (_, index) => {
      const values = Object.values(args);
      return values[parseInt(index)] ?? "";
    });

    for (const [key, value] of Object.entries(args)) {
      result = result.replace(new RegExp(`\\$${key}`, "g"), value);
    }

    return result;
  }

  private substituteContext(content: string, context: SkillInvocationContext): string {
    let result = content;

    result = result.replace(/\$WORKING_DIR/g, context.workingDirectory);
    result = result.replace(/\$SESSION_ID/g, context.session.id);
    result = result.replace(/\$CLIENT_ID/g, context.session.clientId);
    result = result.replace(/\$MODE/g, context.mode);

    return result;
  }

  validateArguments(skill: Skill, args: Record<string, string>): string[] {
    const errors: string[] = [];
    const content = skill.content;

    const argMatches = content.match(/\$ARGUMENTS\[(\d+)\]/g);
    if (argMatches) {
      const indices = argMatches.map((m) => parseInt(m.match(/\d+/)?.[0] ?? "0"));
      const maxIndex = Math.max(...indices);
      const argValues = Object.values(args);

      if (argValues.length <= maxIndex) {
        errors.push(`Skill "${skill.name}" expects at least ${maxIndex + 1} arguments, got ${argValues.length}`);
      }
    }

    return errors;
  }
}
