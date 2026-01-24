# Feature Update Workflow

You are now in workflow mode.

## Task Description
{TASK_DESCRIPTION}

---


# Feature Update Workflow

You are now in workflow mode.

## Task Description
[task description]

---


# Feature Update Workflow

You are now in workflow mode.

## Task Description
[task description]

---

# Feature Update Agent - Intentional Feature Modification

You are now in **Feature Update Mode** for modifying existing, working functionality.

This workflow is for **intentional changes** to working features - not bug fixes. Use this when:
- Enhancing existing behavior
- Changing UX/UI patterns
- Modifying business logic
- Improving performance of existing features

## Task Description
[task description]

---

## 🔒 SAFETY GUARANTEE: PRE-UPDATE COMMIT

**This workflow automatically creates a safety commit BEFORE any code changes are made.**

Before implementation begins (Phase 3), the agent will execute:
```bash
git add -A
git commit -m "Before updating [feature]: [change description]"
```

This ensures you can **always rollback** to the exact state before the update was attempted using `git revert` or `git reset`.

---

## 📎 @IMPLEMENTS COMMENT STANDARD

All source files must include an `@implements` comment at the top referencing their implementation plan(s).

### Comment Format by File Type
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

### Exempt Files (do NOT add @implements)
- `node_modules/`, `.next/`, `dist/`, `build/` directories
- Config files: `*.config.js`, `*.config.ts`, `tsconfig.json`, `package.json`, etc.
- Generated files: `prisma/generated/`, `*.d.ts` (generated)
- Root-level dotfiles: `.env`, `.gitignore`, `.eslintrc`, etc.
- Test fixtures and mocks
- `CLAUDE.md`, `README.md`, `CHANGELOG.md`

---

## 🔍 PHASE 1: CURRENT STATE ANALYSIS (MANDATORY)

Before making ANY changes, complete this analysis:

### Step 1: Locate Implementation Plan (CRITICAL - BLOCKING)

**Action Required**:
- Search `/docs/features/` for `[feature-name]-implementation-plan.md`
- The feature MUST have an implementation plan document

**Questions to Answer**:
1. Does an implementation plan exist for this feature?
2. If NO → **STOP and ask user to create implementation plan first** (use `/shacoof-document-feature`)
3. If YES → Read and understand:
   - Current architecture
   - Existing behavior documentation
   - Previous updates in changelog (if any)
   - Known issues section

**Status**: ⏳ PENDING

---

### Step 2: Document Current Behavior (CRITICAL)

**Action Required**:
- Read the existing code thoroughly
- Document EXACTLY how it works NOW (this becomes the "old behavior" after update)

**Current Behavior Documentation**:

| Aspect | Current Behavior | Evidence (file:line) |
|--------|------------------|----------------------|
| UI Behavior | [describe what user sees/does] | [location] |
| API Behavior | [describe request/response] | [location] |
| Data Model | [describe data structure] | [location] |
| User Workflow | [describe step-by-step flow] | [location] |
| Edge Cases | [describe special handling] | [location] |
| Error Handling | [describe error scenarios] | [location] |

**Status**: ⏳ PENDING

---

### Step 3: Review Development Guidelines

**Action Required**:
- Read `docs/DEVELOPMENT_GUIDELINES.md`
- Identify ALL relevant sections for this update:
  - [ ] Grids & Tabulator (if data tables involved)
  - [ ] API Routes (if backend involved)
  - [ ] Internationalization (if UI text involved)
  - [ ] Permissions (if access control involved)
  - [ ] Theming (if styling involved)
  - [ ] Logging (if debug/error handling)
  - [ ] Organization Filtering (if tenant data)
  - [ ] React Components (if UI components)
  - [ ] Custom Editors (if Tabulator custom editors)
  - [ ] Caching (if data persistence)

**Status**: ⏳ PENDING

---

### Step 4: Verify @implements References

**Action Required**:
- Check each affected file for `@implements` comment
- Cross-reference with the implementation plan

**Compliance Table**:
| File | Has @implements? | References Correct Plan? | Action Needed |
|------|------------------|--------------------------|---------------|
| [file1] | ☐ Yes ☐ No | ☐ Yes ☐ No ☐ N/A | [action] |

**Status**: ⏳ PENDING

---

## 📋 CHANGE SPECIFICATION (Complete Before Proceeding)

**STOP. You must complete this specification before planning any changes:**

### Desired Changes

| Aspect | Current Behavior | Desired Behavior | Rationale |
|--------|------------------|------------------|-----------|
| [aspect1] | [what it does now] | [what it should do] | [why change] |
| [aspect2] | [what it does now] | [what it should do] | [why change] |

### Impact Assessment

**User-Facing Impact**:
- **Breaking Changes**: Will existing users notice a difference? ☐ Yes ☐ No
  - If YES, describe: [what users will experience differently]
- **Learning Curve**: Do users need to learn new behavior? ☐ Yes ☐ No
- **Workflow Changes**: Do existing workflows change? ☐ Yes ☐ No

**Technical Impact**:
- **Data Migration**: Does existing data need transformation? ☐ Yes ☐ No
- **API Changes**: Do API contracts change? ☐ Yes ☐ No
  - Request format changes? ☐ Yes ☐ No
  - Response format changes? ☐ Yes ☐ No
- **Permission Changes**: Do access rules change? ☐ Yes ☐ No
- **Translation Changes**: Do UI strings change? ☐ Yes ☐ No
- **Database Schema**: Does schema change? ☐ Yes ☐ No

### Affected Components

| Component | File Path | Change Type | Risk Level | Notes |
|-----------|-----------|-------------|------------|-------|
| [component] | [path] | Modify/Replace/Remove | High/Medium/Low | [notes] |

---

## 🛠️ PHASE 2: UPDATE PLANNING (MANDATORY)

### Proposed Implementation

**Describe the update in detail**:
1. What code changes are needed?
2. What is the order of operations?
3. Are there dependencies between changes?

### Backward Compatibility Strategy

Select one:
- [ ] **Fully Backward Compatible** - No user-visible changes to existing workflows
- [ ] **Soft Breaking** - Behavior changes but no errors for existing usage
- [ ] **Hard Breaking** - Existing usage may fail or produce errors
- [ ] **Feature Flagged** - New behavior behind a flag for gradual rollout

**Migration Path** (if not fully backward compatible):
1. [Step 1 for users/data to transition]
2. [Step 2]
3. [Step 3]

### Compliance Matrix

**Verify compliance with DEVELOPMENT_GUIDELINES.md**:

| Guideline Section | Relevant? | Compliance Status | Notes |
|-------------------|-----------|-------------------|-------|
| Central Logging (createLogger) | ☐ Yes ☐ No | ☐ Compliant ☐ N/A | |
| Internationalization (i18n) | ☐ Yes ☐ No | ☐ Compliant ☐ N/A | |
| Permissions (RBAC) | ☐ Yes ☐ No | ☐ Compliant ☐ N/A | |
| Organization Filtering | ☐ Yes ☐ No | ☐ Compliant ☐ N/A | |
| Theme Tokens (no custom CSS) | ☐ Yes ☐ No | ☐ Compliant ☐ N/A | |
| Tabulator Grid Patterns | ☐ Yes ☐ No | ☐ Compliant ☐ N/A | |
| Caching (no-store for editable) | ☐ Yes ☐ No | ☐ Compliant ☐ N/A | |
| Custom Editors | ☐ Yes ☐ No | ☐ Compliant ☐ N/A | |
| Race Conditions | ☐ Yes ☐ No | ☐ Compliant ☐ N/A | |

**Additional Checks**:
- [ ] Update does NOT introduce hardcoded text (breaks i18n)
- [ ] Update does NOT use console.log (must use createLogger)
- [ ] Update does NOT bypass permission checks
- [ ] Update does NOT use direct Prisma (must use getFilteredPrisma for tenant data)
- [ ] Update does NOT add custom CSS values (must use theme tokens)
- [ ] Update does NOT create destructive database operations
- [ ] All modified files have correct `@implements` comment (or are exempt)

### Testing Strategy

**How will you verify the update works?**:
- [ ] **Regression Testing**: Existing functionality not broken
- [ ] **New Behavior Testing**: Updated functionality works as specified
- [ ] **Edge Cases**: Boundary conditions handled
- [ ] **Role Testing**: Works for all applicable roles (SysAdmin, OrgAdmin, Planner, General)
- [ ] **Language Testing**: Works in both English and Hebrew
- [ ] **RTL Testing**: Layout correct for Hebrew
- [ ] **Organization Isolation**: Multi-tenant data properly separated

### Rollback Plan

**If the update causes problems**:
1. **Rollback procedure**: `git revert <commit>` or specific steps
2. **Data rollback needed?**: ☐ Yes ☐ No
   - If YES, describe rollback steps: [steps]
3. **Monitoring**: How will we detect if the update failed?

---

## ⏸️ APPROVAL CHECKPOINT (MANDATORY)

**STOP. Present the following to the user for approval:**

1. ✅ **Current Behavior Documentation** (what exists now)
2. ✅ **Change Specification** (current vs. desired, with rationale)
3. ✅ **Impact Assessment** (breaking changes, migrations needed)
4. ✅ **Backward Compatibility Strategy** (how existing users are affected)
5. ✅ **Compliance Matrix** (all guidelines followed)
6. ✅ **Testing Strategy** (how you'll verify)
7. ✅ **Rollback Plan** (if things go wrong)

**Ask the user**: "May I proceed with the feature update as planned?"

**Do NOT proceed to Phase 3 until user approves.**

---

## 🚀 PHASE 3: IMPLEMENTATION (Only After Approval)

### Step 1: Pre-Update Commit (MANDATORY)

**CRITICAL**: Create a commit BEFORE making any changes.

```bash
git add -A
git commit -m "Before updating [feature]: [change description]"
```

**Verification**:
- [ ] Commit created successfully
- [ ] Commit message clearly describes what update is about to happen

**If commit fails (working tree clean)**: Document this and proceed.

---

### Step 2: Implement the Update

**Follow this sequence**:

1. **Verify/Add @implements comments** (MANDATORY for each file)
   - For NEW files: Add `@implements` comment as first line
   - For EXISTING files: Check for `@implements`, add if missing
   - Reference the relevant implementation plan(s)
   - Skip exempt files (config, generated, node_modules, etc.)

2. **Make code changes** according to approved plan
   - Follow all DEVELOPMENT_GUIDELINES.md patterns
   - Use createLogger() for any new logging
   - Use theme tokens for any styling
   - Use i18n for any text
   - Use permission checks for any protected operations

3. **Add comments** explaining the update
   - Reference the change rationale in comments
   - Note any non-obvious logic
   - Mark intentional behavior changes

4. **Run tests**
   - Run build: `npm run build`
   - Run @implements validation: `npx tsx scripts/verify-implements.ts`
   - Manually test updated behavior
   - Run regression tests

---

### Step 3: Update Implementation Plan Documentation (MANDATORY)

**This is the key documentation step. Follow this pattern:**

#### A. Update Main Sections (Source of Truth)

Update the main documentation sections to reflect the NEW behavior. Add change indicators where behavior changed:

**Example - Before:**
```markdown
### User Actions
| Action | Behavior |
|--------|----------|
| Click Save | Saves data |
```

**Example - After:**
```markdown
### User Actions
| Action | Behavior | Notes |
|--------|----------|-------|
| Click Save | Saves data and closes modal | *Changed in [Update #3](#update-3-modal-auto-close)* |
```

The asterisk with anchor link signals to readers: "This behavior was updated - see changelog for previous behavior"

#### B. Add Changelog Entry (Historical Reference)

Add a new entry to the **Feature Updates Changelog** section at the bottom of the implementation plan:

```markdown
---

## Feature Updates Changelog

### Update #[N]: [Short Title] {#update-[n]-[slug]}
**Date**: [YYYY-MM-DD]
**Commit**: `[commit hash]`
**Type**: Behavior Change / Enhancement / Performance / UX Improvement

#### Changes Made
| Aspect | Previous Behavior | New Behavior | Rationale |
|--------|-------------------|--------------|-----------|
| [aspect] | [old behavior - from Phase 1 documentation] | [new behavior] | [why] |

#### Migration Notes
[Steps users/admins need to take, or "None required"]

#### Breaking Changes
[List any breaking changes, or "None"]

#### Files Modified
- `[file1]`: [what changed]
- `[file2]`: [what changed]

---
```

**If this is the first update**, create the changelog section:
```markdown
---

## Feature Updates Changelog

### Update #1: [Title] {#update-1-[slug]}
...

### Initial Implementation
**Date**: [original implementation date]
**Commit**: `[original commit]`

Original implementation as documented above.
```

---

### Step 4: Update DEVELOPMENT_GUIDELINES.md (if needed)

**Evaluate**: Should DEVELOPMENT_GUIDELINES.md be updated?

**Update guidelines if**:
- [ ] Update revealed a missing pattern
- [ ] Update introduced a new best practice
- [ ] Update revealed unclear documentation
- [ ] Update created a reusable pattern others should follow

**If updating guidelines**:
1. Add relevant section or update existing
2. Document the pattern
3. Provide code examples
4. Reference the update commit

---

### Step 5: Final Commit

**Create detailed commit message**:

```bash
git add -A
git commit -m "$(cat <<'EOF'
update: [One-line summary of feature update]

## Change Summary
- Feature: [feature name]
- Previous: [old behavior - brief]
- Updated: [new behavior - brief]
- Rationale: [why change was made]

## Breaking Changes
[List any breaking changes, or "None"]

## Migration Required
[Migration steps, or "None required"]

## Changes
- [File:line]: [What changed and why]
- [File:line]: [What changed and why]

## Documentation Updated
- [x] Implementation plan main sections updated
- [x] Changelog entry added (Update #[N])
- [x] Change indicators added to affected sections

## Testing
- [x] Regression tests passed
- [x] New behavior verified
- [x] Build successful
- [x] @implements validation passed

## Compliance
- [x] Follows DEVELOPMENT_GUIDELINES.md
- [x] Follows implementation plan architecture
- [x] All files have @implements comments

Related Files:
- [List of modified files]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## 📊 POST-UPDATE VERIFICATION

After committing, verify:

1. **Build Status**: ✅ TypeScript compilation successful
2. **Update Applied**: ✅ New behavior works as specified
3. **No Regressions**: ✅ Existing functionality not broken
4. **Documentation Complete**: ✅ Implementation plan updated with:
   - Main sections reflect new behavior
   - Change indicators point to changelog
   - Changelog entry documents old behavior
5. **Commit Quality**: ✅ Detailed commit message with context

---

## 🛑 CRITICAL STOP POINTS

**The feature update agent will STOP and request approval at these points:**

1. **Missing implementation plan** → Ask user to document feature first
2. **Current state not documented** → Cannot proceed without understanding existing behavior
3. **Change specification incomplete** → Must define before/after clearly
4. **Breaking changes detected** → Must get explicit user approval
5. **Before implementing update** → Present full plan and compliance matrix
6. **Before updating documentation** → Confirm changelog format

---

## ⚠️ NEVER ALLOWED

**The feature update agent must NEVER**:
- ❌ Make changes without documenting current behavior first
- ❌ Skip the pre-update commit
- ❌ Bypass compliance checks
- ❌ Ignore development guidelines
- ❌ Make undocumented breaking changes
- ❌ Use console.log, hardcoded text, or custom CSS
- ❌ Skip documentation updates (main sections AND changelog)
- ❌ Create destructive database operations
- ❌ Overwrite old behavior documentation without preserving in changelog

---

## 🎯 SUCCESS CRITERIA

**A successful feature update includes**:
1. ✅ Current behavior documented BEFORE changes
2. ✅ Change specification approved by user
3. ✅ Pre-update commit created
4. ✅ Update implemented according to approved plan
5. ✅ Implementation plan main sections updated to reflect new behavior
6. ✅ Changelog entry added with old behavior preserved
7. ✅ Change indicators added linking to changelog
8. ✅ Regression tests passed
9. ✅ New behavior verified
10. ✅ Detailed commit message with full context
11. ✅ No unintended side effects

---

## 📝 DOCUMENTATION UPDATE CHECKLIST

Before marking the update complete, verify documentation:

- [ ] **Main sections** show current (new) behavior
- [ ] **Change indicators** added where behavior changed (format: `*Changed in [Update #N](#anchor)*`)
- [ ] **Changelog section** exists (create if first update)
- [ ] **Changelog entry** includes:
  - [ ] Update number and title with anchor ID
  - [ ] Date and commit hash
  - [ ] Change type
  - [ ] Before/after behavior table
  - [ ] Migration notes
  - [ ] Breaking changes
  - [ ] Files modified
- [ ] **Anchor links** work (test by clicking)

---

## 📝 READY TO BEGIN

**Current Task**: [task description]

**I will now begin Phase 1: Current State Analysis**

Starting with:
1. Searching for implementation plan in `/docs/features/`
2. If found → Document current behavior thoroughly
3. If not found → **STOP and request feature documentation first**

**Proceeding with analysis...**
