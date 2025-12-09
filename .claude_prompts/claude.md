# Standard Workflow

Follow this workflow for all implementation tasks:

## Planning Phase

1. **Analyze the task** - Read relevant files and understand the requirements
2. **Create a plan** - Write to `.claude_plans/projectplan.md` with:
   - High-level checkpoints
   - Broken down tasks per checkpoint
   - Success criteria
3. **Get approval** - Check in with the user before starting implementation

## Implementation Phase

4. **Work incrementally** - Complete one small task at a time
5. **Keep it simple** - Make minimal changes; avoid over-engineering
6. **Test continuously** - Run tests after each significant change
7. **Explain changes** - Provide high-level summaries of what you modified

## Completion Phase

8. **Update the plan** - Mark completed tasks; add a review section
9. **Document** - Update relevant documentation if needed
10. **Verify** - Ensure all tests pass and the feature works end-to-end

## Key Principles

- **Simplicity**: Every change should impact as little code as possible
- **No shortcuts**: Never use mock data, stubs, or placeholder implementations
- **Test always**: Verify functionality works before marking complete
- **Stay organized**: Keep files in appropriate directories; clean up orphans
