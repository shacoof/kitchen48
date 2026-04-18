# Custom Claude Code Slash Commands

This directory contains custom slash commands for Claude Code that enforce project-specific workflows and standards.

---

## 📋 Documentation Strategy

**All modules use CLAUDE.md files for documentation** - located in each module directory.

### Why Module CLAUDE.md?
- **Co-location**: Documentation lives next to the code it describes
- **Enforced by workflows**: `/shacoof-react-dev` Phase 4 mandates CLAUDE.md updates
- **Structured**: Each module follows the template in main `CLAUDE.md`
- **Discoverable**: Claude Code automatically reads CLAUDE.md files

### Module CLAUDE.md Locations
```
backend/src/modules/[module]/CLAUDE.md
frontend/src/modules/[module]/CLAUDE.md
```

See main `CLAUDE.md` → "Module Structure & Documentation" for the full template.

---

## Available Commands

### `/shacoof-orchestrate` - Workflow Selection & Compliance Gate

**Start here for any task.** This is a mandatory pre-work gate that ensures the correct workflow is selected and all project conventions are followed before any work begins.

#### Usage

```
/shacoof-orchestrate <task description>
```

#### Examples

```
/shacoof-orchestrate The mobile view shows "step not found" when visiting the home page
```

```
/shacoof-orchestrate Add PWA support for installable app experience
```

```
/shacoof-orchestrate Change the recipe card layout to show cooking time
```

#### What It Does

1. **Step 1: Read All Orchestrator Instructions** — Reads `.orchestrator.json`, project `CLAUDE.md`, and global `~/CLAUDE.md`
2. **Step 2: Review All Skills** — Lists every skill available in the session
3. **Step 3: Review All Slash Commands** — Lists every command in `.claude/commands/`
4. **Step 4: Task Analysis** — Classifies the task and recommends the appropriate workflow
5. **Step 5: Approval Checkpoint** — Presents the full plan and **waits for explicit approval**
6. **Step 6: Execute** — Invokes the approved workflow

#### Key Principle

**No work begins until the user approves the workflow selection and execution plan.** This prevents skipping investigation steps, using the wrong workflow, or jumping straight to code.

---

### `/shacoof-bug-fix` - Systematic Bug Investigation & Resolution

Rigorous bug investigation workflow with mandatory compliance verification before fixing.

#### Usage

```
/shacoof-bug-fix <bug description>
```

#### Examples

```
/shacoof-bug-fix Parameter values revert to old values after editing
```

```
/shacoof-bug-fix Users can't see projects from their organization
```

```
/shacoof-bug-fix Task grid shows cached data instead of fresh updates
```

#### What It Does

1. **Phase 1: Investigation (MANDATORY)**
   - Locates module CLAUDE.md documentation
   - Reviews relevant CLAUDE.md sections
   - Examines logs in `/logs/` directory
   - Reproduces and identifies root cause
   - Creates detailed investigation report

2. **Phase 2: Solution Planning (MANDATORY)**
   - Proposes detailed fix with justification
   - Verifies no breaking changes to module architecture
   - Defines testing strategy
   - Plans rollback procedure
   - **STOPS for user approval before proceeding**

3. **Phase 3: Implementation (Only After Approval)**
   - Creates pre-fix commit (MANDATORY)
   - Implements approved fix
   - Updates module CLAUDE.md "Known Issues" section
   - Creates detailed commit with full context
   - Verifies build and tests pass

#### Investigation Checklist

**Before any fix is attempted**:
- ✅ Module CLAUDE.md located and reviewed
- ✅ Root cause identified (not guessed)
- ✅ Evidence documented (logs, code location)
- ✅ Impact assessed (user, data, security)

#### Compliance Matrix

**Every fix must verify**:
- ✅ Follows central logging pattern (createLogger)
- ✅ Maintains i18n compliance (no hardcoded text)
- ✅ Preserves permission checks (RBAC)
- ✅ Continues organization filtering (multi-tenancy)
- ✅ Uses theme tokens (no custom CSS)
- ✅ Follows Tabulator patterns (if grid-related)
- ✅ Respects caching rules (no-store for editable data)
- ✅ Avoids race conditions (if async operations)

#### Stop Points

**The agent STOPS at these critical points**:
1. **Module CLAUDE.md missing** → Creates one using the template
2. **Investigation incomplete** → Cannot fix without understanding cause
3. **Breaking changes detected** → Requires explicit approval
4. **Before implementing fix** → Presents full plan and waits for approval

#### Benefits

- ✅ Prevents "quick fixes" that break other features
- ✅ Ensures root cause is understood before fixing
- ✅ Documents lessons learned in module CLAUDE.md
- ✅ Creates detailed investigation trail
- ✅ Prevents regressions through compliance checks

#### Output Documents

**Investigation Report**:
- Bug symptom and root cause
- Affected files and code locations
- Log evidence
- Impact assessment

**Updated Documentation**:
- Module CLAUDE.md "Known Issues & Fixes" section
- Detailed commit message with full context

---

### `/shacoof-react-dev` - React Development Workflow with Compliance Enforcement

Enforces the mandatory workflow checklist from `CLAUDE.md` before any code changes.

### `/shacoof-feature-update` - Intentional Feature Modification

Workflow for making intentional changes to existing, working functionality. Use this when enhancing features, changing behavior, or improving UX - not for bug fixes.

#### Usage

```
/shacoof-feature-update <change description>
```

#### Examples

```
/shacoof-feature-update Change save button to auto-close modal after saving
```

```
/shacoof-feature-update Add keyboard shortcut (Ctrl+S) to save form
```

```
/shacoof-feature-update Change grid sorting to remember user preference
```

#### What It Does

1. **Phase 1: Current State Analysis (MANDATORY)**
   - Locates module CLAUDE.md documentation
   - Documents current behavior thoroughly
   - Reviews relevant CLAUDE.md sections

2. **Phase 2: Update Planning (MANDATORY)**
   - Creates change specification (current vs. desired behavior)
   - Assesses impact (breaking changes, migrations, API changes)
   - Plans backward compatibility strategy
   - Defines testing and rollback strategy
   - **STOPS for user approval before proceeding**

3. **Phase 3: Implementation (Only After Approval)**
   - Creates pre-update commit (MANDATORY)
   - Implements approved changes
   - Updates module CLAUDE.md with new behavior details
   - Creates detailed commit with full context

#### Documentation Pattern

**Key principle**: Document current (new) behavior as source of truth; preserve old behavior in changelog.

**Main section (after update)**:
```markdown
| Action | Behavior | Notes |
|--------|----------|-------|
| Click Save | Saves and closes modal | *Changed in [Update #3](#update-3-modal-auto-close)* |
```

**Changelog entry**:
```markdown
### Update #3: Modal Auto-Close {#update-3-modal-auto-close}
**Date**: 2025-12-13
**Commit**: `abc1234`

| Aspect | Previous Behavior | New Behavior | Rationale |
|--------|-------------------|--------------|-----------|
| Save action | Modal stayed open | Modal closes automatically | User feedback |
```

#### Key Differences from Bug Fix

| Aspect | Bug Fix | Feature Update |
|--------|---------|----------------|
| Starting point | Something is broken | Everything works |
| Investigation | Root cause analysis | Current state documentation |
| Goal | Restore intended behavior | Change to new behavior |
| Documentation | Known Issues section | Changelog with old behavior |

#### Stop Points

**The agent STOPS at these critical points**:
1. **Module CLAUDE.md missing** → Creates one using the template
2. **Current behavior not documented** → Cannot proceed without baseline
3. **Breaking changes detected** → Requires explicit approval
4. **Before implementing update** → Presents full plan and waits for approval

#### Benefits

- ✅ Preserves historical context (old behavior documented)
- ✅ Readers see current behavior first (source of truth)
- ✅ Change indicators signal what's new
- ✅ Full traceability via changelog
- ✅ Prevents undocumented breaking changes
- ✅ Maintains compliance with all guidelines

---

### `/shacoof-react-dev` - React Development Workflow (Plan → Commit → Execute)

Enforces a strict **Plan → Commit → Execute** workflow for React development.

#### Usage

```
/shacoof-react-dev <task description>
```

#### Examples

```
/shacoof-react-dev Add user export feature to the users grid
```

```
/shacoof-react-dev Implement new project status filter
```

```
/shacoof-react-dev Create dashboard component with stats cards
```

#### What It Does

1. **Phase 1: Planning (NO code changes)**
   - Analyzes task requirements
   - Explores relevant codebase
   - Identifies affected modules (frontend/backend)
   - Creates detailed implementation plan

2. **Phase 2: Approval Checkpoint**
   - Presents implementation plan to user
   - Waits for explicit approval before proceeding
   - Allows plan modifications if needed

3. **Phase 3: Pre-Execution Commit**
   - Creates safety commit before any code changes
   - Ensures rollback is always possible

4. **Phase 4: Update Module CLAUDE.md**
   - Updates `frontend/CLAUDE.md` or `backend/CLAUDE.md`
   - Documents patterns, conventions, and implementation notes
   - Creates/updates module-specific context for future work

5. **Phase 5: Execution**
   - Implements according to approved plan
   - Commits incrementally after logical units
   - Tests as implementation progresses

#### Key Principles

- **Plan first, code second** - No code changes until plan is approved
- **Safety commits** - Always commit before making changes
- **Document as you go** - Module CLAUDE.md updated with each feature
- **Incremental commits** - Logical units of work committed separately

#### Benefits

- ✅ Prevents wasted effort from unclear requirements
- ✅ Enables easy rollback with pre-execution commits
- ✅ Builds module-specific documentation over time
- ✅ Ensures alignment before implementation begins
- ✅ Creates audit trail of decisions and changes

---

## Creating New Slash Commands

To create a new slash command:

1. Create a new `.md` file in this directory: `.claude/commands/your-command.md`
2. Write the prompt that Claude should execute
3. Use the command with `/your-command` in Claude Code

### Template

```markdown
# Your Command Name

Brief description of what this command does.

## Instructions

Detailed instructions for Claude to follow...

## Parameters

- {PARAM_NAME} - Description

## Example Output

What the user should expect...
```

---

## Tips

- Use `{VARIABLE_NAME}` for placeholder values in your commands
- Commands can include checklists, code examples, and structured workflows
- Keep commands focused on a single purpose
- Include clear approval/stop points for user interaction

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Main project instructions
- [Claude Code Documentation](https://docs.claude.com/claude-code)
