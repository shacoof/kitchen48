# React Dev Workflow

You are now in **React Development Workflow Mode**.

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
2. Create NEW worktree for this task
3. Clean up stale worktrees first

Which option? (1/2/3 or specify worktree name)
```

**WAIT for user response before proceeding.**

## 0.2 If Creating New Worktree

**ASK the user:**
```
🌳 WORKTREE SETUP

I will create an isolated worktree for this task:
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

## WORKFLOW OVERVIEW

This workflow enforces a strict **Plan → Commit → Execute** sequence:

1. **PHASE 1: PLANNING** - Analyze and create implementation plan (NO code changes)
2. **PHASE 2: APPROVAL** - User reviews and approves plan
3. **PHASE 3: PRE-EXECUTION COMMIT** - Commit current state before any changes
4. **PHASE 4: UPDATE MODULE CLAUDE.md** - Document relevant info in module's CLAUDE.md
5. **PHASE 5: EXECUTION** - Implement according to approved plan
6. **PHASE 6: MERGE & CLEANUP** - Merge branch and clean up worktree

---

## CLAUDE.md GUIDELINES QUICK REFERENCE

**These guidelines MUST be followed. Show compliance in your implementation plan.**

| Guideline | Rule |
|-----------|------|
| **Logging** | Use `createLogger('Name')` - NEVER `console.log/warn/error` |
| **DB Naming** | TypeScript: `camelCase`, Database: `snake_case` via `@map()` |
| **Prisma** | Import from `@/core/database/prisma` - never `new PrismaClient()` |
| **Modules** | Each module must have its own `CLAUDE.md` file |
| **Commits** | Pre-edit commit before changes, incremental commits during work |
| **DB Safety** | Never use `migrate reset`, `db push --force-reset`, `DROP`, `TRUNCATE` |

---

## PHASE 1: PLANNING (MANDATORY - NO CODE CHANGES)

**You are in PLANNING MODE. Do NOT write any code yet.**

### Step 1: Understand the Task

Read and analyze:
- What is the user asking for?
- What type of work is this? (New feature / Enhancement / Bug fix / Refactoring)

### Step 2: Explore the Codebase

Investigate relevant files:
- Search for related components, services, and utilities
- Identify the module(s) affected (frontend / backend / both)
- Understand existing patterns and architecture

### Step 3: Identify Affected Module(s)

Determine which module(s) will be modified:
- [ ] **frontend/** - React + Vite application
- [ ] **backend/** - Node.js + Express API

### Step 4: Create Implementation Plan

Document your plan with the following structure:

```markdown
## Implementation Plan

### Summary
[One-sentence description of what will be done]

### Module(s) Affected
- [ ] frontend/
- [ ] backend/

### Files to Modify/Create
| File | Action | Description |
|------|--------|-------------|
| [path] | Create/Modify/Delete | [what changes] |

### Implementation Steps
1. [First step]
2. [Second step]
3. [Third step]
...

### Dependencies
[Any packages to install or prerequisites]

### Testing Approach
[How to verify the implementation works]

### CLAUDE.md Compliance Checklist
[Show compliance with project guidelines]

- [ ] **Logging**: Using `createLogger()` instead of `console.log/warn/error`
- [ ] **Database naming**: `camelCase` in TypeScript, `snake_case` in DB via `@map()`
- [ ] **Prisma singleton**: Importing from `@/core/database/prisma`, not creating new instances
- [ ] **Module structure**: New modules include `CLAUDE.md` documentation
- [ ] **No forbidden DB commands**: Not using `migrate reset`, `db push --force-reset`, etc.
- [ ] **Security**: No hardcoded secrets, proper input validation, OWASP considerations
```

---

## PHASE 2: APPROVAL CHECKPOINT

**STOP. Present your implementation plan to the user.**

Ask: "Here is my implementation plan. Do you approve? (Yes / No / Modify)"

**DO NOT proceed until the user explicitly approves the plan.**

---

## PHASE 3: PRE-EXECUTION COMMIT (MANDATORY)

**After approval, BEFORE writing any code:**

Execute the following commit:

```bash
git add -A
git commit -m "Before: [brief task description]"
```

**Verification:**
- [ ] Commit created successfully
- [ ] If working tree was clean, note "No pre-commit needed - working tree was clean"

**This ensures you can always rollback to the state before implementation.**

---

## PHASE 4: UPDATE MODULE CLAUDE.md (MANDATORY)

**After the pre-execution commit, update the CLAUDE.md of the affected module(s).**

### For each affected module (frontend/ or backend/):

1. **Check if module CLAUDE.md exists:**
   - If `frontend/CLAUDE.md` or `backend/CLAUDE.md` exists, read it
   - If not, create it with the template below

2. **Add relevant information** from your implementation plan:
   - New patterns or conventions introduced
   - Important file locations
   - API endpoints (if backend)
   - Component structure (if frontend)
   - Any module-specific commands or scripts

### Module CLAUDE.md Template

```markdown
# [Module Name] - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Key Files & Structure

[Document important files and their purposes]

---

## Patterns & Conventions

[Document patterns specific to this module]

---

## Implementation Notes

[Notes from implementations, organized by feature/date]

### [Feature/Task Name] - [Date]
- [Relevant detail]
- [Relevant detail]

---
```

### What to Add

Include information that would be helpful for future development:
- File organization decisions
- Component patterns used
- API route patterns
- State management approach
- Testing patterns
- Any non-obvious implementation details

**Commit the CLAUDE.md update:**
```bash
git add [module]/CLAUDE.md
git commit -m "docs: Update [module] CLAUDE.md with [feature] context"
```

---

## PHASE 5: EXECUTION

**Now implement according to your approved plan.**

### Implementation Guidelines

1. **Follow the plan** - Implement exactly as approved
2. **Commit incrementally** - Commit after each logical unit of work
3. **Test as you go** - Verify each change works before proceeding

### Commit Message Format

```bash
git commit -m "[type]: [description]

[Optional body with details]

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

---

## PHASE 6: MERGE & CLEANUP (MANDATORY)

**After all implementation is complete, ASK THE USER:**

```
🏁 TASK COMPLETE - READY TO MERGE

Summary of changes:
- [list of commits made]
- Branch: feature/<task-name>
- Worktree: ../worktrees/feature-<task-name>

Actions to perform:
1. Push branch to remote
2. Merge to main (or create PR)
3. Clean up worktree

Proceed with merge and cleanup? (yes/no/pr-only)
```

**If "yes" (direct merge):**
```bash
git push -u origin feature/<task-name>

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
git push -u origin feature/<task-name>
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

## CRITICAL RULES

### NEVER:
- Skip the worktree setup check at session start
- Write code before completing Phase 1 (Planning)
- Proceed to execution without user approval (Phase 2)
- Skip the pre-execution commit (Phase 3)
- Skip updating module CLAUDE.md (Phase 4)
- Deviate from the approved plan without re-approval
- Leave worktrees uncleaned after task completion

### ALWAYS:
- Check for existing worktrees at session start
- Plan first, code second
- Get explicit approval before execution
- Create safety commit before making changes
- Document learnings in module CLAUDE.md
- Commit after logical units of work
- **Show CLAUDE.md compliance checklist in implementation plan**
- Use `createLogger()` for all logging (never `console.log`)
- Follow database naming conventions (`@map()` for snake_case)
- Ask user about merge/cleanup at task completion

---

## READY TO BEGIN

**Starting Step 0: Worktree Setup**

I will now:
1. Check for existing worktrees (`git worktree list`)
2. Ask which worktree to use or create new
3. Then proceed to Phase 1: Planning

**Proceeding with worktree check...**
