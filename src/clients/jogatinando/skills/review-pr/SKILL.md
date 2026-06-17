---
name: review-pr
description: Review a pull request for code quality, security, and best practices
disable-model-invocation: false
allowed-tools: Bash(gh *) Read Grep Glob
context: fork
agent: Explore
---

Review pull request $ARGUMENTS:

1. Fetch PR details: `gh pr view $ARGUMENTS`
2. Fetch PR diff: `gh pr diff $ARGUMENTS`
3. Analyze changed files for:
   - Code quality and readability
   - Security vulnerabilities
   - Test coverage
   - Performance implications
   - Adherence to project conventions
4. Provide structured feedback with:
   - Summary of changes
   - Issues found (with severity: critical/warning/info)
   - Suggestions for improvement
   - Approval recommendation
