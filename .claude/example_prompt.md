# [Project Name]: [Brief Project Description]

<!--
TEMPLATE INSTRUCTIONS:
This is a comprehensive project prompt template. Copy this file and customize
each section for your specific project. Delete sections that don't apply.

Search for "<!-- CUSTOMIZE" to find all sections requiring your input.
-->

## Project Vision

<!-- CUSTOMIZE: Replace with your project's vision statement -->
[Describe the overarching goal of your project - what problem does it solve and for whom?]

## Critical Architectural Decisions

<!-- CUSTOMIZE: Document important architectural decisions and constraints -->

### 1. [Decision Title]
**Approach:**
- [What you will do]
- [Key implementation choice]

**Avoid:**
- [What NOT to do and why]

**Rationale:** [Why this decision was made]

### 2. [Another Decision Title]
**Strategy:**
- [Key strategy point 1]
- [Key strategy point 2]

## Core Functionality Requirements

<!-- CUSTOMIZE: Define the core functionality your project must support -->

### Functional Requirements

1. **[Requirement Category 1]:**
   ```python
   # Example usage showing the API/interface
   result = your_function(param1, param2)
   ```

2. **[Requirement Category 2]:**
   ```python
   # Example usage
   ```

3. **[Requirement Category 3]:**
   - Sub-requirement A
   - Sub-requirement B
   - Sub-requirement C

### Data/Input Specifications

<!-- CUSTOMIZE: Define data structures and input requirements -->

**Input Requirements:**
- Required fields: [list required fields]
- Optional fields: [list optional fields]
- Validation rules: [list validation rules]

**Output Format:**
- [Describe expected output format]
- [Include example if helpful]

## Standardized Output Format

<!-- CUSTOMIZE: Define your project's standard output formats -->

All [components/functions/endpoints] MUST return data in this format:

### [Output Type 1]

**Fields:**
- `field1`: [type] - [description]
- `field2`: [type] - [description]
- `field3`: [type] - [description]

**Example:**
```json
{
  "field1": "value1",
  "field2": 123,
  "field3": true
}
```

### [Output Type 2]

**Fields:**
- [Define fields]

## Component/Feature Specifications

<!-- CUSTOMIZE: List the components or features to implement -->

### [Category 1: e.g., Core Components]

1. **[Component Name]** - `function_name()`
   - Purpose: [What it does]
   - Parameters: [List parameters]
   - Returns: [What it returns]

2. **[Component Name]** - `function_name()`
   - Purpose: [What it does]
   - Engines/Backends: [List if applicable]

### [Category 2: e.g., Utilities]

1. **[Utility Name]**
   - Purpose: [What it does]

## Core Infrastructure Components

<!-- CUSTOMIZE: Document the technical infrastructure -->

### 1. [Infrastructure Component 1]

**Purpose:** [What this component does]

**Architecture:**
- [Key architectural point]
- [Key architectural point]

**API Example:**
```python
# Example code showing usage
```

### 2. [Infrastructure Component 2]

**Purpose:** [What this component does]

**Key Methods:**
- `method1()`: [Description]
- `method2()`: [Description]

## Implementation Phases

<!-- CUSTOMIZE: Define your implementation roadmap -->

### Phase 1: Foundation (Priority: High)

**Goal:** [What this phase achieves]

**Components to Implement:**
1. [Component 1] - [Brief description]
2. [Component 2] - [Brief description]
3. [Component 3] - [Brief description]

**Success Criteria:**
- [Measurable criterion 1]
- [Measurable criterion 2]

**Documentation Deliverables:**
- API reference for [component]
- Tutorial: `docs/tutorials/[name].md`
- Demo script: `examples/[name].py`

### Phase 2: [Phase Name]

**Goal:** [What this phase achieves]

**Components to Implement:**
1. [Component 1]
2. [Component 2]

**Success Criteria:**
- [Criteria]

### Phase 3: [Phase Name]

**Goal:** [What this phase achieves]

**Components to Implement:**
1. [Component 1]

### Phase 4: Polish and Production

**Goal:** Production-ready with full documentation

**Features:**
1. [Feature 1]
2. [Feature 2]
3. Performance optimizations
4. Complete documentation

---

## Environment Setup Requirements

### Python Virtual Environment

<!-- CUSTOMIZE: Adjust for your language/framework -->

**Environment Name:** `[project-name]-env`

**Setup Steps:**

1. **Create the virtual environment:**
   ```bash
   python -m venv [project-name]-env
   ```

2. **Activate the environment:**
   ```bash
   # macOS/Linux
   source [project-name]-env/bin/activate

   # Windows
   [project-name]-env\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install --upgrade pip setuptools wheel
   pip install -e ".[dev]"
   ```

4. **Register Jupyter kernel (if using notebooks):**
   ```bash
   python -m ipykernel install --user --name=[project-name]-env
   ```

### Environment Usage Rules

**ALWAYS:**
- Activate the environment before any work
- Verify active environment: `echo $VIRTUAL_ENV`
- Update requirements after installing packages: `pip freeze > requirements.txt`

**NEVER:**
- Run scripts in system Python
- Install packages globally

### Dependency Files Structure

```
[project-name]/
├── requirements.txt              # Core runtime dependencies
├── requirements-dev.txt          # Development dependencies
├── requirements-optional.txt     # Optional dependencies
├── pyproject.toml               # Package metadata
└── [project-name]-env/          # Virtual environment (in .gitignore)
```

---

## Project Planning Instructions

### Coding Rules and Resources

**CRITICAL:** Follow the guidelines in `.claude/CLAUDE.md`:
- Direct implementation only - no mocks, stubs, or TODOs
- Multi-dimensional analysis for complex requirements
- Continuous testing after each checkpoint
- Organized file structure

### Use Available Claude Code Resources

#### 1. Slash Commands
Use custom slash commands for specialized tasks:
- `/ultra-think [problem]` - Deep analysis and problem solving
- `/code-review [file]` - Comprehensive code review
- `/generate-tests [component]` - Generate test suite
- `/architecture-review` - Review architecture patterns
- `/create-architecture-documentation` - Generate architecture docs
- `/update-docs` - Update documentation systematically

#### 2. Agents
Specialized agents are available via the Task tool:
- `python-pro` - Python optimization and best practices
- `test-engineer` - Test strategy and automation
- `code-reviewer` - Code quality and security
- `debugger` - Error investigation and fixes
- `technical-researcher` - Technical research and analysis

### Planning Workflow

1. **Create `.claude_plans/projectplan.md`** with:
   - High-level checkpoints for each phase
   - Broken down list of tasks per checkpoint
   - Dependencies between tasks
   - Success criteria

2. **Implementation Workflow:**
   - Verify environment is active
   - Implement feature following CLAUDE.md principles
   - Write tests immediately after implementation
   - Run tests and verify passing
   - Document as you go

3. **After Each Checkpoint:**
   - Run all tests
   - Update API documentation
   - Create tutorial/demo if applicable
   - Update project plan with completion notes

### Documentation Standards

**For Tutorial Notebooks (.ipynb):**
- Clear learning objectives
- Realistic example data
- Markdown explanations between code cells
- "Next Steps" section at the end

**For Demo Scripts (.py):**
- Docstring explaining what the script demonstrates
- Environment verification at the start
- Clear progress output
- Comments explaining major steps

**For API Documentation:**
- NumPy docstring format
- Parameters, Returns, Raises, Examples sections
- At least 2 examples per function

---

## Implementation Principles

1. **Simplicity First:** Every change should be as simple as possible
2. **Incremental Progress:** Complete one small task at a time
3. **Test Continuously:** Write and run tests after each checkpoint
4. **Document Continuously:** Update docs after each major feature
5. **No Over-Engineering:** Only implement what's explicitly needed

---

<!-- CUSTOMIZE: Add any project-specific sections below -->

## [Custom Section Title]

[Add project-specific content here]
