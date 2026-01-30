# Bug Fix Workflow

You are now in workflow mode.

## Task Description
{TASK_DESCRIPTION}

---


# Bug Fix Workflow

You are now in workflow mode.

## Task Description
[task description]

---


# Bug Fix Workflow

You are now in workflow mode.

## Task Description
[task description]

---


# Bug Fix Agent - Systematic Bug Investigation & Resolution

You are now in **Bug Fix Mode** with mandatory investigation and compliance verification.

## Task Description
[task description]

---

## 🔒 SAFETY GUARANTEE: PRE-FIX COMMIT

**This workflow automatically creates a safety commit BEFORE any code changes are made.**

Before implementation begins (Phase 3), the agent will execute:
```bash
git add -A
git commit -m "Before fixing [bug description]"
```

This ensures you can **always rollback** to the exact state before the fix was attempted using `git revert` or `git reset`.

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


### Exempt Files (do NOT add @implements)
- `node_modules/`, `.next/`, `dist/`, `build/` directories
- Config files: `*.config.js`, `*.config.ts`, `tsconfig.json`, `package.json`, etc.
- Generated files: `prisma/generated/`, `*.d.ts` (generated)
- Root-level dotfiles: `.env`, `.gitignore`, `.eslintrc`, etc.
- Test fixtures and mocks
- `CLAUDE.md`, `README.md`, `CHANGELOG.md`

---

## 🔍 PHASE 1: PRE-FIX INVESTIGATION (MANDATORY)

Before making ANY changes, complete this investigation checklist:

### Step 1: Locate Implementation Plan (CRITICAL - BLOCKING)

**Action Required**:
- Search CLAUDE.md in all relevant subfolders
- The feature must have an implementation plan document

**Questions to Answer**:
1. Does an implementation plan exist for this feature?
2. If NO → **STOP and ask user to create implementation plan first**
3. If YES → Read and understand:
   - Original architecture
   - Design decisions
   - Known issues section
   - Test cases

**Status**: ⏳ PENDING

---

### Step 2: Review Development Guidelines

**Action Required**:
- Read `CLAUDE.md`
- Identify ALL relevant sections for this bug:
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

**Questions to Answer**:
1. Which guideline sections are relevant?
2. Are there existing "LESSONS LEARNED" sections about similar bugs?
3. What patterns must be followed for the fix?

**Status**: ⏳ PENDING

---

### Step 3: Examine Logs (if available)

**Action Required**:
- Check `/logs/` directory for recent errors
- Look for log files with relevant timestamps
- Search for error patterns related to the bug

**Questions to Answer**:
1. Are there error logs that describe this issue?
2. What error messages or stack traces exist?
3. What was the sequence of events leading to the bug?

**Status**: ⏳ PENDING

---

### Step 4: Reproduce & Understand the Bug

**Action Required**:
- Read relevant code files identified from implementation plan
- Trace the code path that exhibits the bug
- Identify the root cause

**Questions to Answer**:
1. What is the exact symptom of the bug?
2. What is the root cause? (Be specific - no guessing)
3. Why did this happen? (Design flaw, missing check, race condition, etc.)
4. Are there related bugs that might occur from same root cause?

**Status**: ⏳ PENDING

---

### Step 5: Verify @implements References

**Action Required**:
- Check each affected file for `@implements` comment
- Cross-reference with the implementation plan being investigated
- Run validation: `npx tsx scripts/verify-implements.ts`

**Questions to Answer**:
1. Do all affected files have `@implements` comments?
2. Do the comments correctly reference the relevant implementation plan(s)?
3. Are there discrepancies suggesting undocumented changes?

**If `@implements` comment is MISSING**:
- Flag this as a compliance issue
- Add to fix scope: "Add missing @implements comment"

**If `@implements` comment EXISTS but WRONG/INCOMPLETE**:
- Investigate if file was modified outside of documented plan
- Document discrepancy in investigation report

**Compliance Table**:
| File | Has @implements? | References Correct Plan? | Action Needed |
|------|------------------|--------------------------|---------------|
| [file1] | ☐ Yes ☐ No | ☐ Yes ☐ No ☐ N/A | [action] |

**Status**: ⏳ PENDING

---

## 📋 INVESTIGATION REPORT (Complete Before Proceeding)

**STOP. You must complete this report before planning any fix:**

### Bug Details
- **Symptom**: [What the user sees/experiences]
- **Root Cause**: [Technical explanation of why it happens]
- **Affected Files**: [List all files involved]
- **Frequency**: [Always / Sometimes / Rare]

### Evidence
- **Code Location**: [File:line where bug occurs]
- **Log Evidence**: [Any relevant log entries]
- **Related Issues**: [Similar bugs in implementation plan's Known Issues section]

### Impact Assessment
- **User Impact**: [How does this affect users?]
- **Data Safety**: [Can this cause data loss/corruption?]
- **Security Impact**: [Any security implications?]
- **Scope**: [Is this isolated or systemic?]

---

## 🛠️ PHASE 2: SOLUTION PLANNING (MANDATORY)

Once investigation is complete, plan the solution:

### Proposed Solution

**Describe the fix in detail**:
1. What code changes are needed?
2. Why will this fix work?
3. Are there alternative approaches? Why is this one best?

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
- [ ] Fix does NOT introduce hardcoded text (breaks i18n)
- [ ] Fix does NOT use console.log (must use createLogger)
- [ ] Fix does NOT bypass permission checks
- [ ] Fix does NOT use direct Prisma (must use getFilteredPrisma for tenant data)
- [ ] Fix does NOT add custom CSS values (must use theme tokens)
- [ ] Fix does NOT create destructive database operations
- [ ] All modified files have correct `@implements` comment (or are exempt)

### Implementation Plan Compliance

**Verify compliance with feature implementation plan**:

| Aspect | Original Design | Proposed Change | Breaking? | Justification |
|--------|----------------|-----------------|-----------|---------------|
| Architecture | [Original] | [Change] | ☐ Yes ☐ No | [Why safe] |
| API Endpoints | [Original] | [Change] | ☐ Yes ☐ No | [Why safe] |
| Data Model | [Original] | [Change] | ☐ Yes ☐ No | [Why safe] |
| UI Components | [Original] | [Change] | ☐ Yes ☐ No | [Why safe] |
| Permissions | [Original] | [Change] | ☐ Yes ☐ No | [Why safe] |

**Critical Questions**:
1. Does this fix maintain backward compatibility? ☐ Yes ☐ No
2. Does this fix follow the original architecture? ☐ Yes ☐ No
3. Will this fix affect other features? ☐ Yes ☐ No
4. If YES to #3, which features and how will you verify they still work?

### Testing Strategy

**How will you verify the fix works?**:
- [ ] Manual test of the specific bug scenario
- [ ] Regression test of related functionality
- [ ] Test with different roles (if permission-related)
- [ ] Test with different languages (if UI-related)
- [ ] Test organization isolation (if multi-tenant data)

### Rollback Plan

**If the fix causes problems**:
1. What is the rollback procedure? [git revert <commit>, etc.]
2. Are there any data migrations that need reversal? ☐ Yes ☐ No
3. What monitoring will detect if the fix failed?

### Implementation Steps Summary (MANDATORY)

**You MUST explicitly list ALL steps you will take after approval:**

| Step | Description | Details |
|------|-------------|---------|
| 1. Pre-fix commit | `git commit -m "Before fixing [X]"` | [Exact commit message] |
| 2. Code changes | Files to modify | [List files and changes] |
| 3. Update implementation plan | Add to "Known Issues & Fixes" | [Which plan file] |
| 4. Evaluate DEVELOPMENT_GUIDELINES.md | Will update? ☐ Yes ☐ No | [If yes, what section] |
| 5. Testing | How you'll verify | [List test steps] |
| 6. Final commit | Detailed commit message | [Summary of commit] |

**Why this is required**: The user approves the COMPLETE plan, not just the code changes. All mandatory workflow steps must be visible at approval time.

---

## ⏸️ APPROVAL CHECKPOINT (MANDATORY)

**STOP. Present the following to the user for approval:**

1. ✅ **Investigation Report** (from Phase 1)
2. ✅ **Proposed Solution** (detailed description)
3. ✅ **Compliance Matrix** (all checks passed)
4. ✅ **Implementation Plan Compliance** (no breaking changes or justified)
5. ✅ **Testing Strategy** (how you'll verify)
6. ✅ **Rollback Plan** (if things go wrong)
7. ✅ **Implementation Steps Summary** (ALL steps including pre-commit, docs, guidelines)

**Ask the user**: "May I proceed with the fix as planned?"

**Do NOT proceed to Phase 3 until user approves.**

---

## 🚀 PHASE 3: IMPLEMENTATION (Only After Approval)

### Step 1: Pre-Fix Commit (MANDATORY)

**CRITICAL**: Create a commit BEFORE making any changes.

```bash
git add -A
git commit -m "Before fixing [bug description]"
```

**Verification**:
- [ ] Commit created successfully
- [ ] Commit message clearly describes what bug is about to be fixed

**If commit fails (working tree clean)**: Document this and proceed.

---

### Step 2: Implement the Fix

**Follow this sequence**:

1. **Verify/Add @implements comments** (MANDATORY for each file)
   - For NEW files: Add `@implements` comment as first line (after shebang if present)
   - For EXISTING files: Check for `@implements`, add if missing
   - Reference the relevant implementation plan(s)
   - Skip exempt files (config, generated, node_modules, etc.)

2. **Make code changes** according to approved plan
   - Follow all DEVELOPMENT_GUIDELINES.md patterns
   - Use createLogger() for any new logging
   - Use theme tokens for any styling
   - Use i18n for any text
   - Use permission checks for any protected operations

4. **Add comments** explaining the fix
   - Reference the bug in comments
   - Explain why this fixes the root cause
   - Note any non-obvious logic

5. **Update implementation plan's "Known Issues" section**
   - Document the bug that was fixed
   - Document the root cause
   - Document the fix applied
   - Add date and commit reference

6. **Test the fix**
   - Run build: `npm run build`
   - Run @implements validation: `npx tsx scripts/verify-implements.ts`
   - Verify TypeScript compilation succeeds
   - Manually test the bug scenario
   - Test regression cases

---

### Step 3: Update DEVELOPMENT_GUIDELINES.md (if needed)

**Evaluate**: Should DEVELOPMENT_GUIDELINES.md be updated?

**Update guidelines if**:
- [ ] Bug revealed a missing pattern
- [ ] Bug revealed unclear documentation
- [ ] Bug is likely to recur without guidance
- [ ] Fix introduces a new best practice

**If updating guidelines**:
1. Add a new "LESSONS LEARNED" section
2. Document the bug pattern
3. Document the correct pattern
4. Provide before/after code examples
5. Reference the bug fix commit

---

### Step 4: Final Commit

**Create detailed commit message**:

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: [One-line summary of bug fix]

[Detailed description of bug and fix]

## Bug Description
- Symptom: [What user experienced]
- Root Cause: [Technical cause]
- Frequency: [Always/Sometimes/Rare]

## Solution
[Detailed explanation of fix]

## Changes
- [File:line]: [What changed and why]
- [File:line]: [What changed and why]

## Testing
- [x] Manual test passed
- [x] Build successful
- [x] No regression issues

## Compliance
- [x] Follows DEVELOPMENT_GUIDELINES.md
- [x] Follows implementation plan architecture
- [x] Updated implementation plan Known Issues
- [x] Updated guidelines (if needed)

Related Files:
- [List of modified files]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## 📊 POST-FIX VERIFICATION

After committing, verify:

1. **Build Status**: ✅ TypeScript compilation successful
2. **Bug Resolved**: ✅ Original bug symptom no longer occurs
3. **No Regressions**: ✅ Related features still work
4. **Documentation Updated**: ✅ Implementation plan and/or guidelines updated
5. **Commit Quality**: ✅ Detailed commit message with context

---

## 🛑 CRITICAL STOP POINTS

**The bug fix agent will STOP and request approval at these points:**

1. **Missing implementation plan** → Ask user to create one first
2. **Investigation incomplete** → Cannot proceed without understanding root cause
3. **Solution not compliant** → Must revise plan to meet guidelines
4. **Breaking changes detected** → Must get explicit user approval
5. **Before implementing fix** → Present full plan and compliance matrix
6. **Before updating guidelines** → Discuss whether update is warranted

---

## ⚠️ NEVER ALLOWED

**The bug fix agent must NEVER**:
- ❌ Make changes without understanding root cause
- ❌ Skip the pre-fix commit
- ❌ Bypass compliance checks
- ❌ Ignore development guidelines
- ❌ Break existing architecture without approval
- ❌ Use console.log, hardcoded text, or custom CSS
- ❌ Skip documentation updates
- ❌ Create destructive database operations

---

## 🎯 SUCCESS CRITERIA

**A successful bug fix includes**:
1. ✅ Complete investigation report with root cause identified
2. ✅ Compliance matrix showing adherence to all guidelines
3. ✅ Pre-fix commit created
4. ✅ Fix implemented according to approved plan
5. ✅ Implementation plan updated with bug details
6. ✅ Guidelines updated (if warranted)
7. ✅ Detailed commit message with full context
8. ✅ Build passes with no TypeScript errors
9. ✅ Bug verified as fixed
10. ✅ No regressions introduced

---

## 📝 READY TO BEGIN

**Current Task**: [task description]

**I will now begin Phase 1: Investigation**

Starting with:
1. Searching for implementation plan in `/docs/features/`
2. If found → Proceed with investigation
3. If not found → **STOP and request implementation plan creation**

**Proceeding with investigation...**
