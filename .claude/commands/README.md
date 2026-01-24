# Custom Claude Code Slash Commands

This directory contains custom slash commands for Claude Code that enforce project-specific workflows and standards.

---

## 📎 @implements Comment Standard

**All slash commands enforce the `@implements` comment standard** for traceability between source files and implementation plans.

### Why?
- **Traceability**: Know which implementation plan each file relates to
- **Safety**: Prevent undocumented changes to critical code
- **Documentation**: Automatically generate file-to-plan mappings
- **Onboarding**: New developers can quickly understand code ownership

### Format by File Type
| File Type | Format |
|-----------|--------|
| `.ts`, `.tsx`, `.js`, `.jsx` | `/** @implements /docs/features/[name]-implementation-plan.md */` |
| `.css`, `.scss` | `/* @implements /docs/features/[name]-implementation-plan.md */` |
| `.md` | `<!-- @implements /docs/features/[name]-implementation-plan.md -->` |
| `.sql` | `-- @implements /docs/features/[name]-implementation-plan.md` |

### Multiple Plans
```typescript
/**
 * @implements /docs/features/user-management-implementation-plan.md
 * @implements /docs/features/permissions-implementation-plan.md
 */
```

### Exempt Files
- `node_modules/`, `.next/`, `dist/`, `build/` directories
- Config files: `*.config.js`, `*.config.ts`, `tsconfig.json`, `package.json`
- Generated files: `prisma/generated/`, `*.d.ts` (generated)
- Root-level dotfiles: `.env`, `.gitignore`, `.eslintrc`
- Test fixtures and mocks
- `CLAUDE.md`, `README.md`, `CHANGELOG.md`
- Next.js app router files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### Validation Script
```bash
# Check all files for @implements compliance
npx tsx scripts/verify-implements.ts

# Show verbose output (all files)
npx tsx scripts/verify-implements.ts --verbose

# Filter by specific plan
npx tsx scripts/verify-implements.ts --plan /docs/features/user-management-implementation-plan.md

# Output as JSON
npx tsx scripts/verify-implements.ts --json
```

---

## Available Commands

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
   - Searches for feature implementation plan (**STOPS if missing**)
   - Reviews relevant DEVELOPMENT_GUIDELINES.md sections
   - Examines logs in `/logs/` directory
   - Reproduces and identifies root cause
   - Creates detailed investigation report

2. **Phase 2: Solution Planning (MANDATORY)**
   - Proposes detailed fix with justification
   - Creates compliance matrix against DEVELOPMENT_GUIDELINES.md
   - Verifies no breaking changes to implementation plan
   - Defines testing strategy
   - Plans rollback procedure
   - **STOPS for user approval before proceeding**

3. **Phase 3: Implementation (Only After Approval)**
   - Creates pre-fix commit (MANDATORY)
   - Implements approved fix
   - Updates implementation plan's "Known Issues" section
   - Updates DEVELOPMENT_GUIDELINES.md (if warranted)
   - Creates detailed commit with full context
   - Verifies build and tests pass

#### Investigation Checklist

**Before any fix is attempted**:
- ✅ Implementation plan located and reviewed
- ✅ Root cause identified (not guessed)
- ✅ Evidence documented (logs, code location)
- ✅ Impact assessed (user, data, security)
- ✅ Development guidelines reviewed

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
1. **No implementation plan found** → Requests user create one first
2. **Investigation incomplete** → Cannot fix without understanding cause
3. **Solution not compliant** → Must revise to meet guidelines
4. **Breaking changes detected** → Requires explicit approval
5. **Before implementing fix** → Presents full plan and waits for approval

#### Benefits

- ✅ Prevents "quick fixes" that break other features
- ✅ Ensures root cause is understood before fixing
- ✅ Documents lessons learned for future reference
- ✅ Maintains compliance with all guidelines
- ✅ Creates detailed investigation trail
- ✅ Updates implementation plans with bug history
- ✅ Prevents regressions through compliance checks

#### Output Documents

**Investigation Report**:
- Bug symptom and root cause
- Affected files and code locations
- Log evidence
- Impact assessment

**Compliance Matrix**:
- All guideline checks verified
- Implementation plan compatibility confirmed
- Breaking changes identified and justified

**Updated Documentation**:
- Implementation plan "Known Issues" section
- DEVELOPMENT_GUIDELINES.md "LESSONS LEARNED" (if warranted)
- Detailed commit message with full context

---

### `/shacoof-react-dev` - React Development Workflow with Compliance Enforcement

Enforces the mandatory workflow checklist from `CLAUDE.md` before any code changes.

### `/shacoof-document-feature` - Feature Documentation Generator

Creates comprehensive implementation plan documents following the established template structure.

#### Usage

```
/shacoof-document-feature <feature name>
```

#### Examples

```
/shacoof-document-feature user-management
```

```
/shacoof-document-feature genai-prompts
```

```
/shacoof-document-feature project-dashboard
```

#### What It Does

1. **Information Gathering**
   - Asks clarifying questions about the feature
   - Searches codebase for relevant files
   - Analyzes API routes, components, and services
   - Identifies permissions, translations, and theme tokens

2. **Architecture Analysis**
   - Documents file structure
   - Describes component responsibilities
   - Maps API endpoints
   - Explains data flow

3. **Comprehensive Documentation**
   - Creates markdown file in `/docs/features/`
   - Follows established template structure
   - Includes all required sections
   - Adds code examples and commit references

4. **Compliance Verification**
   - Checks multi-tenancy implementation
   - Verifies permission system integration
   - Documents i18n usage
   - Confirms theme token compliance

#### Document Sections Created

- Overview & Requirements
- Architecture (file structure, components, APIs)
- Data Model
- Permissions (role capabilities matrix)
- Translations (all keys with EN/HE)
- Theme Tokens
- Compliance Checklist
- Implementation Steps
- Known Issues & Fixes
- Testing Plan
- Reference Implementation

#### Benefits

- ✅ Ensures complete documentation for all features
- ✅ Provides reference for future modifications
- ✅ Documents lessons learned from bugs
- ✅ Creates consistent documentation structure
- ✅ Facilitates knowledge transfer
- ✅ Supports compliance audits

---

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
   - Searches for feature implementation plan (**STOPS if missing**)
   - Documents current behavior thoroughly (becomes "old behavior" in changelog)
   - Reviews relevant DEVELOPMENT_GUIDELINES.md sections
   - Verifies @implements comments

2. **Phase 2: Update Planning (MANDATORY)**
   - Creates change specification (current vs. desired behavior)
   - Assesses impact (breaking changes, migrations, API changes)
   - Plans backward compatibility strategy
   - Creates compliance matrix
   - Defines testing and rollback strategy
   - **STOPS for user approval before proceeding**

3. **Phase 3: Implementation (Only After Approval)**
   - Creates pre-update commit (MANDATORY)
   - Implements approved changes
   - Updates implementation plan documentation:
     - **Main sections**: Updated to reflect NEW behavior
     - **Change indicators**: Added where behavior changed (links to changelog)
     - **Changelog entry**: Documents OLD behavior for historical reference
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
1. **No implementation plan found** → Requests user document feature first
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
- [DEVELOPMENT_GUIDELINES.md](../../docs/DEVELOPMENT_GUIDELINES.md) - Comprehensive development standards
- [Claude Code Documentation](https://docs.claude.com/claude-code)
