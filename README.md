# Claude Code Project Template

A comprehensive project template optimized for use with [Claude Code](https://claude.ai/code).

## Features

- **Pre-configured Claude Code integration** with optimized directives
- **Slash commands** for code review, testing, architecture documentation
- **Specialized agents** for Python, debugging, research, and more
- **Workflow templates** for consistent development practices
- **Multi-language support** (Python, TypeScript, Go)

## Quick Start

### 1. Clone or Copy This Template

```bash
git clone https://github.com/your-username/claude-template.git my-project
cd my-project
rm -rf .git
git init
```

### 2. Customize for Your Project

1. **Edit `CLAUDE.md`** - Update project overview, setup instructions, architecture
2. **Copy `.claude/example_prompt.md`** - Use as a starting point for project requirements
3. **Update `.gitignore`** - Uncomment lines relevant to your language/framework

### 3. Set Up Your Environment

```bash
# Python
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

# Node.js
npm install

# Go
go mod init your-module-name
```

### 4. Start Building

```bash
# Open with Claude Code
claude

# Or use with your IDE's Claude Code extension
```

## Template Structure

```
your-project/
├── CLAUDE.md                 # Project-specific context (CUSTOMIZE THIS)
├── README.md                 # This file
├── .gitignore                # Multi-language gitignore
├── .claude/
│   ├── CLAUDE.md             # Core directives (rarely modify)
│   ├── TEMPLATE_GUIDE.md     # Customization guide (delete after setup)
│   ├── example_prompt.md     # Project prompt template
│   ├── agents/               # Specialized agents
│   ├── commands/             # Slash commands
│   ├── scripts/              # Utility scripts
│   └── skills/               # MCP skills
├── .claude_plans/            # Project planning documents
├── .claude_prompts/          # Workflow prompts
├── .claude_research/         # Research documents
├── src/                      # Source code
└── tests/                    # Test files
```

## Available Commands

| Command | Description |
|---------|-------------|
| `/ultra-think [problem]` | Deep multi-dimensional analysis |
| `/code-review [file]` | Comprehensive code review |
| `/generate-tests [component]` | Generate test suite |
| `/architecture-review` | Review architecture patterns |
| `/create-architecture-documentation` | Generate architecture docs |
| `/update-docs` | Update documentation |
| `/todo [action]` | Manage project todos |
| `/security-scan [scope]` | Security audit for vulnerabilities |
| `/explain-code [file]` | Detailed code explanation |
| `/create-pr [branch]` | Create PR with auto-generated description |
| `/dependency-update` | Check and update dependencies |

## Available Agents

| Agent | Use For |
|-------|---------|
| `python-pro` | Python optimization, best practices |
| `typescript-pro` | TypeScript type system, strict mode |
| `sql-expert` | Database design, query optimization |
| `ml-engineer` | ML pipelines, model training, MLOps |
| `test-engineer` | Test strategy, automation |
| `code-reviewer` | Code quality, security |
| `debugger` | Error investigation |
| `technical-researcher` | Technical research |

## Customization Guide

See [`.claude/TEMPLATE_GUIDE.md`](.claude/TEMPLATE_GUIDE.md) for detailed customization instructions.

### Key Files to Customize

1. **`CLAUDE.md`** (root) - Your project's main context file
2. **`.claude/example_prompt.md`** - Comprehensive project requirements template
3. **`.gitignore`** - Enable/disable language-specific patterns

## Best Practices

1. **Keep `CLAUDE.md` updated** as your project evolves
2. **Use `.claude_plans/`** for all project planning
3. **Leverage slash commands** for consistent workflows
4. **Store research** in `.claude_research/` for reference

## License

[Your License Here]
