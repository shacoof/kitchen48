# Feature Update Workflow

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
2. Create NEW worktree for this feature update
3. Clean up stale worktrees first

Which option? (1/2/3 or specify worktree name)
```

**WAIT for user response before proceeding.**

## 0.2 If Creating New Worktree

**ASK the user:**
```
🌳 WORKTREE SETUP

I will create an isolated worktree for this feature update:
- Branch name: feature/<short-task-description>
- Worktree path: ../worktrees/feature-<task-name>
- Base: origin/main

Proceed with worktree creation? (yes/no)
```

**If approved, execute:**
```bash
git fetch origin
git worktree add -b feature/<task-name> ../worktrees/feature-<task-name> origin/main
cd ../worktrees/feature-<task-name>
```

**Confirm to user:**
```
✅ WORKTREE CREATED
   Branch: feature/<task-name>
   Path: ../worktrees/feature-<task-name>
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

# Feature Update Agent - Intentional Feature Modification

You are now in **Feature Update Mode** for modifying existing, working functionality.

This workflow is for **intentional changes** to working features - not bug fixes. Use this when:
- Enhancing existing behavior
- Changing UX/UI patterns
- Modifying business logic
- Improving performance of existing features

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

## 🔍 PHASE 1: CURRENT STATE ANALYSIS (MANDATORY)

Before making ANY changes, complete this analysis:

### Step 1: Locate Module CLAUDE.md (CRITICAL - BLOCKING)

**Action Required**:
- Search for `CLAUDE.md` in the relevant module directory:
  - `backend/src/modules/[module]/CLAUDE.md`
  - `frontend/src/modules/[module]/CLAUDE.md`
- The module MUST have documentation

**Questions to Answer**:
1. Does a module CLAUDE.md exist for this feature?
2. If NO → Create one using the template from main `CLAUDE.md`
3. If YES → Read and understand:
   - Current architecture
   - Existing behavior documentation
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

### Step 3: Review Project Guidelines

**Action Required**:
- Read main `CLAUDE.md` for project conventions
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
- [ ] Update does NOT introduce hardcoded text (breaks i18n)
- [ ] Update does NOT use console.log (must use createLogger)
- [ ] Update does NOT bypass permission checks
- [ ] Update does NOT use direct Prisma (must use getFilteredPrisma for tenant data)
- [ ] Update does NOT add custom CSS values (must use theme tokens)
- [ ] Update does NOT create destructive database operations
- [ ] Module CLAUDE.md will be updated with implementation details

**Build & Dependencies**:
- [ ] All new packages installed (`npm install`) and `package-lock.json` committed
- [ ] `npm run build` passes with no errors
- [ ] New LOV types/reference data use data migrations (`backend/prisma/data-migrations/`), NOT manual SQL or seed.ts

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
5. ✅ **Testing Strategy** (how you'll verify)
6. ✅ **Rollback Plan** (if things go wrong)

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

1. **Make code changes** according to approved plan
   - Follow all CLAUDE.md patterns
   - Use createLogger() for any new logging
   - Use theme tokens for any styling
   - Use permission checks for any protected operations

2. **Add comments** explaining the update
   - Reference the change rationale in comments
   - Note any non-obvious logic
   - Mark intentional behavior changes

3. **Run tests**
   - Run build: `npm run build`
   - Manually test updated behavior
   - Run regression tests

---

### Step 3: Update Module CLAUDE.md (MANDATORY)

**Update the module's CLAUDE.md with:**
- New/changed behavior in relevant sections
- Any new API endpoints or components
- Known issues discovered during implementation
- Implementation date

**Example update to Known Issues section:**
```markdown
### Feature Update: [Title] - [YYYY-MM-DD]

**Changed:**
- [aspect]: [old behavior] → [new behavior]

**Reason:** [why the change was made]
```

---

### Step 4: Final Commit

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
- [x] Module CLAUDE.md updated with changes

## Testing
- [x] Regression tests passed
- [x] New behavior verified
- [x] Build successful

## Compliance
- [x] Follows project CLAUDE.md conventions

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

Feature update implementation complete! Please test the changes before we merge.

To test in the worktree:
1. Open a terminal and navigate to the worktree:
   cd <worktree-path>

2. Start the development servers:
   npm run dev

3. Verify the update:
   - [List specific updated features to test]
   - [List expected new behaviors]
   - [List regression checks for existing functionality]

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
git push -u origin feature/<task-name>
```

---

## 🏁 PHASE 5: MERGE & CLEANUP (MANDATORY)

**After branch is pushed, ASK THE USER:**

```
🏁 FEATURE UPDATE COMPLETE - READY TO MERGE

Summary of changes:
- [list of commits made]
- Branch: feature/<task-name> (already pushed to remote)
- Worktree: ../worktrees/feature-<task-name>

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
git merge --no-ff feature/<task-name> -m "Merge feature/<task-name>: <description>"
git push origin main

git worktree remove ../worktrees/feature-<task-name>
git branch -d feature/<task-name>
git push origin --delete feature/<task-name>
```

**If "pr-only" (create PR):**
```bash
gh pr create --title "<task-name>" --body "<description>"
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
6. **Worktree Cleaned**: ✅ Worktree removed after merge

---

## 🛑 CRITICAL STOP POINTS

**The feature update agent will STOP and request approval at these points:**

1. **Session start** → Check for existing worktrees, ask user which to use or create new
2. **Missing module CLAUDE.md** → Create one using the template
3. **Current state not documented** → Cannot proceed without understanding existing behavior
4. **Change specification incomplete** → Must define before/after clearly
5. **Breaking changes detected** → Must get explicit user approval
6. **Before implementing update** → Present full plan and compliance matrix
7. **Before updating documentation** → Confirm changelog format
8. **After implementation complete** → Ask user about merge/PR/cleanup

---

## ⚠️ NEVER ALLOWED

**The feature update agent must NEVER**:
- ❌ Skip the worktree setup check at session start
- ❌ Make changes without documenting current behavior first
- ❌ Skip the pre-update commit
- ❌ Bypass compliance checks
- ❌ Ignore development guidelines
- ❌ Make undocumented breaking changes
- ❌ Use console.log, hardcoded text, or custom CSS
- ❌ Skip documentation updates (main sections AND changelog)
- ❌ Create destructive database operations
- ❌ Overwrite old behavior documentation without preserving in changelog
- ❌ Skip the testing phase - always provide worktree testing instructions
- ❌ Merge before user confirms testing is complete
- ❌ Leave worktrees uncleaned after task completion

---

## 🎯 SUCCESS CRITERIA

**A successful feature update includes**:
1. ✅ Worktree created/selected at session start
2. ✅ Current behavior documented BEFORE changes
3. ✅ Change specification approved by user
4. ✅ Pre-update commit created
5. ✅ Update implemented according to approved plan
6. ✅ Implementation plan main sections updated to reflect new behavior
7. ✅ Changelog entry added with old behavior preserved
8. ✅ Change indicators added linking to changelog
9. ✅ Testing instructions provided with worktree path
10. ✅ User confirmed testing is complete
11. ✅ Regression tests passed
12. ✅ New behavior verified
13. ✅ Detailed commit message with full context
14. ✅ No unintended side effects
15. ✅ User asked about merge/PR at completion
16. ✅ Worktree cleaned up after merge

---

## 📝 READY TO BEGIN

**Current Task**: $ARGUMENTS

**I will now begin Step 0: Worktree Setup**

Starting with:
1. Checking for existing worktrees (`git worktree list`)
2. Asking user which worktree to use or create new
3. Then proceeding to Phase 1: Current State Analysis

**Proceeding with worktree check...**
