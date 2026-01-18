# Iterative Application Testing & Improvement Prompt

## Objective
Systematically test the Personal Filofax application through 20+ passes, identifying and fixing bugs, improving functionality, and documenting UX/UI pain points.

## Prerequisites
- App running on localhost:3333 with DEV_AUTH_BYPASS enabled
- Browser automation tools available (Playwright MCP or webapp-testing skill)
- Database configured (or dev mode active for UI-only testing)

---

## Testing Protocol

### Pass Structure
Each pass should:
1. Test a specific feature area
2. Document any bugs found
3. Fix critical issues immediately
4. Log UX/UI observations
5. Verify fixes from previous passes

### Progress Tracking
After each pass, update `.claude_plans/testing-progress.md` with:
- Pass number and focus area
- Bugs found and fixed
- Remaining issues
- UX/UI observations

---

## Pass Schedule

### Passes 1-4: Core Navigation & Layout
**Pass 1**: Landing page, authentication flow, session persistence
**Pass 2**: Dashboard layout, sidebar navigation, responsive behavior
**Pass 3**: Header components, user menu, theme switching
**Pass 4**: Page transitions, loading states, error boundaries

### Passes 5-8: Task Management
**Pass 5**: Create, read, update, delete tasks
**Pass 6**: Task status changes (TODO → IN_PROGRESS → DONE)
**Pass 7**: Task priorities, due dates, categories, tags
**Pass 8**: Subtasks, recurring tasks, task filtering/sorting

### Passes 9-11: Calendar & Planning
**Pass 9**: Weekly planner view, task assignment to weeks
**Pass 10**: Monthly planner view, month navigation
**Pass 11**: Calendar events, date picker interactions

### Passes 12-14: Habits & Tracking
**Pass 12**: Create habits, habit types (boolean/numeric/duration)
**Pass 13**: Log habit completions, streak tracking
**Pass 14**: Habit visualizations, charts, statistics

### Passes 15-16: Memos & Ideas
**Pass 15**: Memo CRUD, memo types, pinning, archiving
**Pass 16**: Ideas CRUD, idea status workflow, tagging

### Passes 17-18: Categories & Tags
**Pass 17**: Category management, colors, icons
**Pass 18**: Tag management, cross-entity tagging

### Passes 19-20: Integration & Polish
**Pass 19**: Cross-feature integration (tasks with categories, tags, calendar)
**Pass 20**: Full user journey walkthrough, edge cases, final polish

### Passes 21+: Continuous Improvement
Additional passes based on findings from passes 1-20.

---

## Testing Checklist Per Feature

### For Each CRUD Operation:
- [ ] Create with valid data
- [ ] Create with edge cases (empty fields, max length, special characters)
- [ ] Read/display correctly
- [ ] Update all editable fields
- [ ] Delete with confirmation
- [ ] Optimistic updates work
- [ ] Error states handled gracefully
- [ ] Loading indicators present

### For Each Page:
- [ ] Renders without console errors
- [ ] Responsive at mobile (375px), tablet (768px), desktop (1280px)
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Empty states displayed appropriately
- [ ] Data persists after refresh

---

## Bug Report Template

```markdown
### Bug: [Brief Description]
**Pass**: #
**Severity**: Critical/High/Medium/Low
**Location**: [File path and line if known]
**Steps to Reproduce**:
1.
2.
3.
**Expected**:
**Actual**:
**Fix Applied**: Yes/No
**Fix Details**:
```

---

## UX/UI Observation Template

```markdown
### Observation: [Brief Description]
**Category**: Navigation/Forms/Feedback/Layout/Accessibility/Performance
**Location**: [Page/Component]
**Issue**:
**Suggested Improvement**:
**Priority**: P1/P2/P3
```

---

## Execution Instructions

1. **Start the testing session**:
   ```
   Launch browser to localhost:3333
   Open browser dev tools console
   Begin with Pass 1
   ```

2. **For each pass**:
   - Navigate to the relevant feature
   - Execute all checklist items
   - Screenshot any issues
   - Document findings in testing-progress.md
   - Fix critical bugs before moving on
   - Verify fix works

3. **After all passes**:
   - Compile final bug list
   - Compile UX/UI enhancement recommendations
   - Prioritize fixes by impact
   - Create implementation plan for improvements

---

## Success Criteria

After 20 passes:
- [ ] Zero critical bugs
- [ ] All CRUD operations functional
- [ ] No console errors during normal use
- [ ] Responsive design verified
- [ ] Comprehensive UX/UI improvement list generated
- [ ] Clear prioritization of enhancements

---

## Begin Testing

Start with: "Execute Pass 1 - Landing page, authentication flow, session persistence. Use browser automation to navigate the app and test each item systematically. Document all findings."
