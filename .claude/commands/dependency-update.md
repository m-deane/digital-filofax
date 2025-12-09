---
description: Check and update project dependencies with security and compatibility analysis
argument-hint: --check | --update | --major | --security-only
allowed-tools: Bash, Read, Write, Edit
---

# Dependency Update

Manage project dependencies: $ARGUMENTS

## Current State

- Package files: !`ls package.json requirements.txt Cargo.toml go.mod pyproject.toml Gemfile 2>/dev/null`
- Lock files: !`ls package-lock.json yarn.lock pnpm-lock.yaml Pipfile.lock poetry.lock Cargo.lock go.sum Gemfile.lock 2>/dev/null`

## Task

Analyze and optionally update project dependencies.

### 1. Dependency Analysis

**Detect Package Manager:**
- `package.json` → npm/yarn/pnpm
- `requirements.txt` / `pyproject.toml` → pip/poetry
- `Cargo.toml` → cargo
- `go.mod` → go modules
- `Gemfile` → bundler

**Check Current Versions:**

```bash
# Node.js
npm outdated
# or
yarn outdated

# Python
pip list --outdated
# or
poetry show --outdated

# Go
go list -u -m all

# Rust
cargo outdated
```

### 2. Categorize Updates

Group dependencies by update type:

| Category | Risk Level | Action |
|----------|------------|--------|
| **Patch** (1.0.0 → 1.0.1) | Low | Usually safe to update |
| **Minor** (1.0.0 → 1.1.0) | Medium | Review changelog |
| **Major** (1.0.0 → 2.0.0) | High | Breaking changes likely |
| **Security** | Critical | Update immediately |

### 3. Security Vulnerabilities

Check for known vulnerabilities:

```bash
# Node.js
npm audit

# Python
pip-audit
# or
safety check

# Go
govulncheck ./...

# Rust
cargo audit
```

### 4. Compatibility Check

Before updating, verify:
- [ ] Peer dependency compatibility
- [ ] Node/Python/Go version requirements
- [ ] Breaking change impact
- [ ] Deprecated API usage

### 5. Update Report

```markdown
# Dependency Update Report

## Summary
- Total dependencies: X
- Outdated: X
- Security issues: X

## Security Updates (Critical)
| Package | Current | Latest | Vulnerability |
|---------|---------|--------|---------------|
| pkg-a   | 1.0.0   | 1.0.5  | CVE-2024-XXX  |

## Major Updates (Breaking Changes)
| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| pkg-b   | 2.0.0   | 3.0.0  | API changes |

## Minor Updates (New Features)
| Package | Current | Latest |
|---------|---------|--------|
| pkg-c   | 1.2.0   | 1.5.0  |

## Patch Updates (Bug Fixes)
| Package | Current | Latest |
|---------|---------|--------|
| pkg-d   | 1.0.0   | 1.0.3  |

## Recommendations
1. [Immediate action items]
2. [Planned updates]
3. [Packages to skip and why]
```

### 6. Perform Updates

**Conservative (patches only):**
```bash
# Node.js
npm update

# Python
pip install --upgrade <package>

# Go
go get -u=patch ./...
```

**Aggressive (all updates):**
```bash
# Node.js
npx npm-check-updates -u
npm install

# Python
pip install --upgrade -r requirements.txt

# Go
go get -u ./...
```

### 7. Post-Update Verification

After updating:

```bash
# Run tests
npm test  # or pytest, go test

# Check for runtime issues
npm start  # or equivalent

# Verify build
npm run build  # or equivalent
```

### 8. Update Lock Files

Commit updated lock files:

```bash
git add package-lock.json  # or equivalent
git commit -m "chore(deps): update dependencies

- Updated X packages
- Fixed Y security vulnerabilities
- See CHANGELOG for breaking changes

🤖 Generated with Claude Code"
```

## Options

- `--check` - Only report outdated packages (no changes)
- `--update` - Update all to latest compatible versions
- `--major` - Include major version updates
- `--security-only` - Only apply security patches
- `--interactive` - Prompt for each update

## Safety Guidelines

1. **Always run tests** after updating
2. **Update incrementally** for large projects
3. **Read changelogs** for major updates
4. **Keep lock files** in version control
5. **Don't update** right before releases
