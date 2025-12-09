# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code project template** - a reusable starting point for new projects optimized for Claude Code workflows. It includes pre-configured slash commands, specialized agents, workflow templates, and directory structure conventions.

## Repository Structure

```
.claude/                    # Claude Code configuration (core of this template)
├── CLAUDE.md               # Core behavioral directives
├── TEMPLATE_GUIDE.md       # Customization instructions
├── example_prompt.md       # Project requirements template
├── agents/                 # 16 specialized agents
├── commands/               # 14 slash commands
├── scripts/                # Utility scripts
└── skills/                 # MCP skills (webapp-testing, mcp-builder)

.claude_plans/              # Project planning documents
.claude_prompts/            # Workflow prompt templates
.claude_research/           # Research document storage
src/                        # Source code placeholder
tests/                      # Test files placeholder
```

## Key Slash Commands

| Command | Purpose |
|---------|---------|
| `/ultra-think [problem]` | Deep multi-dimensional analysis |
| `/code-review [file]` | Comprehensive code review |
| `/generate-tests [component]` | Generate test suite |
| `/security-scan [scope]` | Security audit |
| `/explain-code [file]` | Detailed code explanation |
| `/create-pr [branch]` | Auto-generate PR description |
| `/dependency-update` | Check/update dependencies |
| `/architecture-review` | Review architecture patterns |
| `/create-architecture-documentation` | Generate architecture docs |

## Key Agents

| Agent | Use For |
|-------|---------|
| `python-pro` | Python best practices, optimization |
| `typescript-pro` | TypeScript type system, strict mode |
| `sql-expert` | Schema design, query optimization |
| `ml-engineer` | ML pipelines, MLOps |
| `test-engineer` | Test strategy, coverage |
| `code-reviewer` | Code quality, security |
| `debugger` | Error investigation |

## Template Customization Workflow

When using this template for a new project:

1. Clone/copy this repository
2. Edit root `CLAUDE.md` - replace `<!-- CUSTOMIZE -->` sections with project specifics
3. Copy `.claude/example_prompt.md` to `.claude_prompts/` and customize
4. Delete `.claude/TEMPLATE_GUIDE.md` after setup
5. Update `.gitignore` for your language/framework

## Core Directives (from .claude/CLAUDE.md)

The template enforces these behavioral patterns:

- **No partial implementations** - Complete working code, no mocks/stubs/TODOs
- **Direct implementation** - Skip hedging language and excessive explanation
- **File organization** - Use `.claude_plans/` for planning, `tests/` for tests
- **Testing discipline** - Run tests after each checkpoint

## Adding New Commands

Create a markdown file in `.claude/commands/` with frontmatter:

```yaml
---
description: Brief description
argument-hint: [arg] | --flag
allowed-tools: Read, Write, Edit, Bash
---
```

## Adding New Agents

Create a markdown file in `.claude/agents/` with frontmatter:

```yaml
---
name: agent-name
description: When to use this agent
tools: Read, Write, Edit, Bash
model: sonnet
---
```
