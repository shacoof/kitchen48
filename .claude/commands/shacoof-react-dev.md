# React Dev Workflow

You are now in **React Development Workflow Mode**.

## Task Description
$ARGUMENTS

---

## WORKFLOW OVERVIEW

This workflow enforces a strict **Plan → Commit → Execute** sequence:

1. **PHASE 1: PLANNING** - Analyze and create implementation plan (NO code changes)
2. **PHASE 2: APPROVAL** - User reviews and approves plan
3. **PHASE 3: PRE-EXECUTION COMMIT** - Commit current state before any changes
4. **PHASE 4: UPDATE MODULE CLAUDE.md** - Document relevant info in module's CLAUDE.md
5. **PHASE 5: EXECUTION** - Implement according to approved plan

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

## CRITICAL RULES

### NEVER:
- Write code before completing Phase 1 (Planning)
- Proceed to execution without user approval (Phase 2)
- Skip the pre-execution commit (Phase 3)
- Skip updating module CLAUDE.md (Phase 4)
- Deviate from the approved plan without re-approval

### ALWAYS:
- Plan first, code second
- Get explicit approval before execution
- Create safety commit before making changes
- Document learnings in module CLAUDE.md
- Commit after logical units of work

---

## READY TO BEGIN

**Starting Phase 1: Planning**

I will now:
1. Analyze the task requirements
2. Explore the relevant codebase
3. Create an implementation plan
4. Present it for your approval

**Proceeding with analysis...**
