# Claude Code Project Template Guide

This guide explains how to use this template to quickly set up a new project with Claude Code optimizations.

## Quick Start Checklist

Use this checklist when starting a new project:

- [ ] Clone or copy this template repository
- [ ] Update `CLAUDE.md` (root) with your project specifics
- [ ] Copy and customize `.claude/example_prompt.md` for your project requirements
- [ ] Update `.gitignore` for your language/framework
- [ ] Create initial project structure (`src/`, `tests/`, etc.)
- [ ] Set up your virtual environment or package manager
- [ ] Create `.claude_plans/projectplan.md` with your roadmap
- [ ] Delete this guide or move to `docs/` once customization is complete

## Template Structure

```
your-project/
├── CLAUDE.md                      # Project-specific instructions (CUSTOMIZE)
├── .claude/
│   ├── CLAUDE.md                  # Core directives (rarely modify)
│   ├── TEMPLATE_GUIDE.md          # This file (delete after setup)
│   ├── example_prompt.md          # Project prompt template (CUSTOMIZE)
│   ├── agents/                    # Specialized agents (generic, keep as-is)
│   ├── commands/                  # Slash commands (generic, keep as-is)
│   ├── scripts/                   # Utility scripts
│   └── skills/                    # MCP skills
├── .claude_plans/                 # Project planning documents
├── .claude_prompts/               # Workflow prompts
│   ├── claude.md                  # Standard workflow
│   └── [custom].md                # Custom prompts
└── .claude_research/              # Research documents
```

## File-by-File Customization

### 1. Root `CLAUDE.md` (HIGH PRIORITY)

This is the main file Claude Code reads for project context.

**What to customize:**
- Project Overview section
- Development Environment setup
- Architecture Overview
- Key Components documentation
- Testing commands
- Dependencies list

**Look for:** `<!-- CUSTOMIZE -->` markers

**Example transformation:**
```markdown
# Before (template)
**[Project Name]** - [Brief description]
**Technology Stack**: <!-- CUSTOMIZE -->

# After (customized)
**MyAPI** - RESTful API for inventory management
**Technology Stack**: Python 3.11, FastAPI, PostgreSQL, Redis
```

### 2. `.claude/example_prompt.md` (HIGH PRIORITY)

This is your comprehensive project requirements document.

**When to use:** Copy this file when starting a complex feature or new project phase.

**What to customize:**
- Project Vision
- Architectural Decisions
- Core Functionality Requirements
- Output Format specifications
- Implementation Phases
- Environment Setup

### 3. `.claude/CLAUDE.md` (LOW PRIORITY)

Core operational directives. Usually keep as-is.

**Only modify if you need to:**
- Add language-specific naming conventions
- Define custom file structure boundaries
- Add project-specific anti-patterns

### 4. `.claude_prompts/claude.md` (OPTIONAL)

Standard workflow template. Modify for custom workflows.

---

## Language/Framework Quick Starts

### Python Project

```markdown
# In root CLAUDE.md, use:

## Development Environment

### Setup
\`\`\`bash
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"
\`\`\`

### Running Tests
\`\`\`bash
pytest tests/ -v
pytest tests/ --cov=mypackage --cov-report=html
\`\`\`

## Key Dependencies
- **fastapi** (0.104+): Web framework
- **sqlalchemy** (2.0+): ORM
- **pytest** (7.0+): Testing
```

### TypeScript/Node.js Project

```markdown
# In root CLAUDE.md, use:

## Development Environment

### Setup
\`\`\`bash
npm install
npm run build
\`\`\`

### Running Tests
\`\`\`bash
npm test
npm run test:coverage
\`\`\`

## Key Dependencies
- **express** (4.18+): Web framework
- **prisma** (5.0+): ORM
- **jest** (29+): Testing
```

### Go Project

```markdown
# In root CLAUDE.md, use:

## Development Environment

### Setup
\`\`\`bash
go mod download
go build ./...
\`\`\`

### Running Tests
\`\`\`bash
go test ./...
go test -cover ./...
\`\`\`

## Key Dependencies
- **gin** (1.9+): Web framework
- **gorm** (1.25+): ORM
```

### Full-Stack Project

```markdown
# In root CLAUDE.md, use:

## Development Environment

### Backend Setup
\`\`\`bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -e ".[dev]"
\`\`\`

### Frontend Setup
\`\`\`bash
cd frontend
npm install
\`\`\`

### Running Both
\`\`\`bash
# Terminal 1: Backend
cd backend && uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev
\`\`\`
```

---

## Available Slash Commands

These commands are pre-configured and ready to use:

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/ultra-think [problem]` | Deep multi-dimensional analysis | Complex architectural decisions |
| `/code-review [file]` | Comprehensive code review | After significant changes |
| `/generate-tests [component]` | Generate test suite | After implementing features |
| `/architecture-review` | Review architecture patterns | Before major refactoring |
| `/create-architecture-documentation` | Generate arch docs | Initial project setup |
| `/update-docs` | Update documentation | After each phase completion |
| `/todo [action]` | Manage project todos | Task tracking |
| `/workflow-orchestrator` | Complex workflow automation | Multi-step processes |
| `/generate-api-documentation` | Auto-generate API docs | API development |
| `/security-scan [scope]` | Security audit | Before releases, after deps update |
| `/explain-code [file]` | Detailed code explanation | Onboarding, complex code review |
| `/create-pr [branch]` | Create PR with description | Ready to merge feature branches |
| `/dependency-update` | Check/update dependencies | Regular maintenance, security |

## Available Agents

These agents can be invoked via the Task tool:

| Agent | Purpose | Use For |
|-------|---------|---------|
| `python-pro` | Python optimization | Refactoring, performance, best practices |
| `typescript-pro` | TypeScript expert | Type system, strict mode, generics |
| `sql-expert` | Database specialist | Schema design, query optimization, migrations |
| `ml-engineer` | Machine learning | Model training, MLOps, feature engineering |
| `test-engineer` | Test strategy | Coverage, test design, automation |
| `code-reviewer` | Code quality | Security, maintainability |
| `debugger` | Error investigation | Bug fixes, issues |
| `technical-researcher` | Technical research | Architecture decisions |
| `error-detective` | Log analysis | Production debugging |
| `prompt-engineer` | Prompt optimization | AI features |
| `ui-ux-designer` | UI/UX design | Interface systems |
| `docusaurus-expert` | Documentation sites | Docusaurus setup |

---

## Best Practices

### 1. Keep Project Context Updated

Update `CLAUDE.md` as your project evolves:
- Add new components to Architecture Overview
- Document new patterns in Common Patterns
- Update Project Status regularly

### 2. Use Planning Documents

Always create `.claude_plans/projectplan.md` before major work:
```markdown
# Project Plan: [Feature Name]

## Phase 1: Foundation
- [ ] Task 1
- [ ] Task 2

## Phase 2: Implementation
- [ ] Task 3
```

### 3. Leverage Research Documents

Store research in `.claude_research/`:
- API documentation analysis
- Library comparisons
- Architecture decision records

### 4. Custom Prompts for Repeated Tasks

Create custom prompts in `.claude_prompts/` for:
- Specific feature development patterns
- Code review checklists
- Deployment procedures

---

## Customization Examples

### Before: Generic Template
```markdown
## Architecture Overview

### Component Structure
\`\`\`
[project-name]/
├── src/
│   ├── [component1]/
│   └── [component2]/
└── tests/
\`\`\`
```

### After: Customized for E-commerce API
```markdown
## Architecture Overview

### Component Structure
\`\`\`
ecommerce-api/
├── src/
│   ├── auth/           # Authentication & authorization
│   ├── products/       # Product catalog management
│   ├── orders/         # Order processing
│   ├── payments/       # Payment integration (Stripe)
│   └── notifications/  # Email & push notifications
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
\`\`\`

### Key Components

**auth/**: JWT-based authentication with refresh tokens
- Key files: `src/auth/jwt.py`, `src/auth/middleware.py`
- Key concepts: Access tokens (15min), Refresh tokens (7d), Role-based access

**products/**: Product CRUD with search and filtering
- Key files: `src/products/models.py`, `src/products/search.py`
- Key concepts: Elasticsearch integration, Category hierarchies
```

---

## Troubleshooting

### Claude Code Not Reading CLAUDE.md
- Ensure file is in the repository root
- Check file encoding (should be UTF-8)
- Restart Claude Code session

### Commands Not Working
- Verify command files exist in `.claude/commands/`
- Check command syntax in the markdown frontmatter
- Ensure `allowed-tools` includes required tools

### Agents Not Available
- Check agent files exist in `.claude/agents/`
- Verify agent `name` matches the invocation name
- Check `tools` list is valid

---

## Removing Template Artifacts

Before going to production, clean up:

1. Delete `.claude/TEMPLATE_GUIDE.md` (this file)
2. Remove `<!-- CUSTOMIZE -->` comments after filling them in
3. Delete unused example sections
4. Remove placeholder `[bracketed text]`
5. Clear `.claude_plans/` of template plans
6. Clear `.claude_research/` of template research

---

## Contributing to the Template

If you improve this template:
1. Keep changes generic and language-agnostic where possible
2. Add new slash commands for common workflows
3. Document new agents with clear use cases
4. Update this guide with new features
