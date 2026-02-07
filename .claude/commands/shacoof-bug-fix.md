# Bug Fix Workflow

You are now in workflow mode.

## Task Description
$ARGUMENTS

---

# STEP 0: GIT WORKTREE SETUP (MANDATORY - DO THIS FIRST)

**BEFORE ANY CODE WORK, you MUST follow the Git Worktree Workflow from the global ~/CLAUDE.md**

## 0.1 Check for Existing Worktrees

**Execute immediately:**
```bash
git worktree list
```

**Then DISPLAY to the user:**
```
🔍 WORKTREE CHECK

Current worktrees:
<output from git worktree list>

Options:
1. Use existing worktree: [name] (if relevant to this task)
2. Create NEW worktree for this bug fix
3. Clean up stale worktrees first

Which option? (1/2/3 or specify worktree name)
```

**WAIT for user response before proceeding.**

## 0.2 If Creating New Worktree

**ASK the user:**
```
🌳 WORKTREE SETUP

I will create an isolated worktree for this bug fix:
- Branch name: fix/<short-bug-description>
- Worktree path: ../worktrees/fix-<bug-name>
- Base: origin/main

Proceed with worktree creation? (yes/no)
```

**If approved, execute:**
```bash
git fetch origin
git worktree add -b fix/<bug-name> ../worktrees/fix-<bug-name> origin/main
cd ../worktrees/fix-<bug-name>
```

**Confirm to user:**
```
✅ WORKTREE CREATED
   Branch: fix/<bug-name>
   Path: ../worktrees/fix-<bug-name>
   Base: origin/main

Now working in isolated environment. Proceeding to Phase 1...
```

## 0.3 If Using Existing Worktree

```bash
cd <existing-worktree-path>
```

**Confirm to user:**
```
✅ USING EXISTING WORKTREE
   Branch: <branch-name>
   Path: <worktree-path>

Continuing work in this environment. Proceeding to Phase 1...
```

---

# Bug Fix Agent - Systematic Bug Investigation & Resolution

You are now in **Bug Fix Mode** with mandatory investigation and compliance verification.

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

## 🔍 PHASE 1: PRE-FIX INVESTIGATION (MANDATORY)

Before making ANY changes, complete this investigation checklist:

### Step 1: Locate Module CLAUDE.md (CRITICAL - BLOCKING)

**Action Required**:
- Search for `CLAUDE.md` in the relevant module directory:
  - `backend/src/modules/[module]/CLAUDE.md`
  - `frontend/src/modules/[module]/CLAUDE.md`

**Questions to Answer**:
1. Does a module CLAUDE.md exist for this feature?
2. If NO → Create one using the template from main `CLAUDE.md`
3. If YES → Read and understand:
   - Original architecture
   - Design decisions
   - Known issues section

**Status**: ⏳ PENDING

---

### Step 2: Review Project Guidelines

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
- Read relevant code files identified from module CLAUDE.md
- Trace the code path that exhibits the bug
- Identify the root cause

**Questions to Answer**:
1. What is the exact symptom of the bug?
2. What is the root cause? (Be specific - no guessing)
3. Why did this happen? (Design flaw, missing check, race condition, etc.)
4. Are there related bugs that might occur from same root cause?

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
- **Related Issues**: [Similar bugs in module CLAUDE.md's Known Issues section]

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

**Verify compliance with project CLAUDE.md**:

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
| Statistics Tracking | ☐ Yes ☐ No | ☐ Compliant ☐ N/A | |

**Additional Checks**:
- [ ] Fix does NOT introduce hardcoded text (breaks i18n)
- [ ] Fix does NOT use console.log (must use createLogger)
- [ ] Fix does NOT bypass permission checks
- [ ] Fix does NOT use direct Prisma (must use getFilteredPrisma for tenant data)
- [ ] Fix does NOT add custom CSS values (must use theme tokens)
- [ ] Fix does NOT create destructive database operations
- [ ] Module CLAUDE.md will be updated with fix details

**Build & Dependencies**:
- [ ] All new packages installed (`npm install`) and `package-lock.json` committed
- [ ] `npm run build` passes with no errors
- [ ] New LOV types/reference data use data migrations (`backend/prisma/data-migrations/`), NOT manual SQL or seed.ts

### Implementation Plan Compliance

**Verify compliance with module CLAUDE.md**:

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
| 3. Update module CLAUDE.md | Add to "Known Issues & Fixes" | [Which module CLAUDE.md] |
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

1. **Make code changes** according to approved plan
   - Follow all CLAUDE.md patterns
   - Use createLogger() for any new logging
   - Use theme tokens for any styling
   - Use permission checks for any protected operations

2. **Add comments** explaining the fix
   - Reference the bug in comments
   - Explain why this fixes the root cause
   - Note any non-obvious logic

3. **Update module CLAUDE.md "Known Issues & Fixes" section**
   - Document the bug that was fixed
   - Document the root cause
   - Document the fix applied
   - Add date and commit reference

4. **Test the fix**
   - Run build: `npm run build`
   - Verify TypeScript compilation succeeds
   - Manually test the bug scenario
   - Test regression cases

---

### Step 3: Final Commit

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
- [x] Follows project CLAUDE.md conventions
- [x] Updated module CLAUDE.md Known Issues

Related Files:
- [List of modified files]

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## 🧪 PHASE 4: TESTING (MANDATORY)

**After implementation is complete, provide testing instructions and WAIT for user confirmation.**

### Step 1: Provide Testing Instructions

**DISPLAY to the user:**
```
🧪 TESTING PHASE

Bug fix implementation complete! Please test the fix before we merge.

To test in the worktree:
1. Open a terminal and navigate to the worktree:
   cd <worktree-path>

2. Start the development servers:
   npm run dev

3. Verify the fix:
   - [Describe how to reproduce the original bug]
   - [Confirm the bug no longer occurs]
   - [Test any related functionality for regressions]

4. The app will be available at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

Please confirm when testing is complete: (done/issues)
```

### Step 2: Wait for User Confirmation

**CRITICAL: Do NOT proceed to merge until user confirms testing is complete.**

- If user says **"done"** → Push branch to remote, then proceed to Phase 5 (Merge & Cleanup)
- If user says **"issues"** → Ask for details and fix before retesting

### Step 3: Push to Remote (After Testing Approved)

**After user confirms testing is complete, push the branch:**
```bash
git push -u origin fix/<bug-name>
```

---

## 🏁 PHASE 5: MERGE & CLEANUP (MANDATORY)

**After branch is pushed, ASK THE USER:**

```
🏁 BUG FIX COMPLETE - READY TO MERGE

Summary of changes:
- [list of commits made]
- Branch: fix/<bug-name> (already pushed to remote)
- Worktree: ../worktrees/fix-<bug-name>

Actions to perform:
1. Merge to main (or create PR)
2. Clean up worktree

Proceed with merge and cleanup? (yes/no/pr-only)
```

**If "yes" (direct merge):**
```bash
cd <original-repo-path>
git fetch origin
git checkout main
git pull origin main
git merge --no-ff fix/<bug-name> -m "Merge fix/<bug-name>: <description>"
git push origin main

git worktree remove ../worktrees/fix-<bug-name>
git branch -d fix/<bug-name>
git push origin --delete fix/<bug-name>
```

**If "pr-only" (create PR):**
```bash
gh pr create --title "Fix: <bug-name>" --body "<description>"
```

**Confirm to user:**
```
✅ MERGE & CLEANUP COMPLETE
   ✓ Branch merged to main (or PR created)
   ✓ Pushed to remote
   ✓ Worktree removed
   ✓ Branch cleaned up

Returned to main repository.
```

---

## 📊 POST-FIX VERIFICATION

After committing, verify:

1. **Build Status**: ✅ TypeScript compilation successful
2. **Bug Resolved**: ✅ Original bug symptom no longer occurs
3. **No Regressions**: ✅ Related features still work
4. **Documentation Updated**: ✅ Implementation plan and/or guidelines updated
5. **Commit Quality**: ✅ Detailed commit message with context
6. **Worktree Cleaned**: ✅ Worktree removed after merge

---

## 🛑 CRITICAL STOP POINTS

**The bug fix agent will STOP and request approval at these points:**

1. **Session start** → Check for existing worktrees, ask user which to use or create new
2. **Missing module CLAUDE.md** → Create one using the template
3. **Investigation incomplete** → Cannot proceed without understanding root cause
4. **Solution not compliant** → Must revise plan to meet guidelines
5. **Breaking changes detected** → Must get explicit user approval
6. **Before implementing fix** → Present full plan and compliance matrix
7. **Before updating guidelines** → Discuss whether update is warranted
8. **After implementation complete** → Ask user about merge/PR/cleanup

---

## ⚠️ NEVER ALLOWED

**The bug fix agent must NEVER**:
- ❌ Skip the worktree setup check at session start
- ❌ Make changes without understanding root cause
- ❌ Skip the pre-fix commit
- ❌ Bypass compliance checks
- ❌ Ignore development guidelines
- ❌ Break existing architecture without approval
- ❌ Use console.log, hardcoded text, or custom CSS
- ❌ Skip documentation updates
- ❌ Create destructive database operations
- ❌ Skip the testing phase - always provide worktree testing instructions
- ❌ Merge before user confirms testing is complete
- ❌ Leave worktrees uncleaned after task completion

---

## 🎯 SUCCESS CRITERIA

**A successful bug fix includes**:
1. ✅ Worktree created/selected at session start
2. ✅ Complete investigation report with root cause identified
3. ✅ Compliance matrix showing adherence to all guidelines
4. ✅ Pre-fix commit created
5. ✅ Fix implemented according to approved plan
6. ✅ Implementation plan updated with bug details
7. ✅ Guidelines updated (if warranted)
8. ✅ Detailed commit message with full context
9. ✅ Build passes with no TypeScript errors
10. ✅ Testing instructions provided with worktree path
11. ✅ User confirmed testing is complete
12. ✅ Bug verified as fixed
13. ✅ No regressions introduced
14. ✅ User asked about merge/PR at completion
15. ✅ Worktree cleaned up after merge

---

## 📝 READY TO BEGIN

**Current Task**: $ARGUMENTS

**I will now begin Step 0: Worktree Setup**

Starting with:
1. Checking for existing worktrees (`git worktree list`)
2. Asking user which worktree to use or create new
3. Then proceeding to Phase 1: Investigation

**Proceeding with worktree check...**
