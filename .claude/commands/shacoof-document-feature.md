# Document Feature Workflow

You are now in **Feature Documentation Mode**.

## Task Description
$ARGUMENTS

---

# STEP 0: GIT WORKTREE SETUP (MANDATORY - DO THIS FIRST)

**BEFORE ANY FILE CHANGES, you MUST follow the Git Worktree Workflow from the global ~/CLAUDE.md**

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
2. Create NEW worktree for this documentation task
3. Clean up stale worktrees first

Which option? (1/2/3 or specify worktree name)
```

**WAIT for user response before proceeding.**

## 0.2 If Creating New Worktree

**ASK the user:**
```
🌳 WORKTREE SETUP

I will create an isolated worktree for this documentation:
- Branch name: docs/<feature-name>-implementation-plan
- Worktree path: ../worktrees/docs-<feature-name>
- Base: origin/main

Proceed with worktree creation? (yes/no)
```

**If approved, execute:**
```bash
git fetch origin
git worktree add -b docs/<feature-name> ../worktrees/docs-<feature-name> origin/main
cd ../worktrees/docs-<feature-name>
```

**Confirm to user:**
```
✅ WORKTREE CREATED
   Branch: docs/<feature-name>
   Path: ../worktrees/docs-<feature-name>
   Base: origin/main

Now working in isolated environment. Proceeding to documentation...
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

Continuing work in this environment.
```

---

# Feature Documentation Generator

Your task is to create a comprehensive implementation plan document for a feature following the established template structure.

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

## 🎯 OBJECTIVE

Create a detailed implementation plan document at `/docs/features/[feature name]-implementation-plan.md` that follows the established structure from existing feature documentation.

---

## 📋 REQUIRED INFORMATION GATHERING

Before creating the document, I need to gather the following information:

### 1. Feature Overview
- [ ] Feature name and purpose
- [ ] Implementation status (Complete/In Progress/Planned)
- [ ] Implementation date
- [ ] Brief description (1-2 sentences)

### 2. Functional Description & Screen Behavior
- [ ] Screen purpose and role in application
- [ ] Screen layout (wireframe/mockup)
- [ ] User interaction behaviors
- [ ] Error handling and recovery
- [ ] State management structure
- [ ] User workflows

### 3. Requirements
- [ ] User requirements
- [ ] Technical requirements
- [ ] Role-based access requirements

### 4. Architecture
- [ ] File structure
- [ ] Component descriptions
- [ ] API endpoint specifications
- [ ] Data flow and state management

### 5. Data Model
- [ ] Existing tables/models used
- [ ] Schema changes (if any)

### 6. Permissions
- [ ] Menu item configuration
- [ ] Role capabilities matrix

### 7. Translations
- [ ] All translation keys added
- [ ] English and Hebrew mappings

### 8. Compliance
- [ ] Multi-tenancy
- [ ] Permission system
- [ ] Internationalization
- [ ] Central logging
- [ ] Theme tokens

### 9. File-to-Plan Mapping
- [ ] List ALL source files that implement this feature
- [ ] Verify each has `@implements` comment

---

## 📊 WORKFLOW STEPS

### Step 1: Discovery & Analysis
- Search for feature-related files
- Read API routes, components, and services
- Check @implements comments in all discovered files

### Step 2: Interview (if needed)
- Ask clarifying questions about requirements and design decisions

### Step 3: @implements Remediation
- Add missing `@implements` comments to feature files
- Commit changes

### Step 4: Document Creation
- Create comprehensive markdown document
- Follow established template structure

### Step 5: Review & Refinement
- Present document for review
- Make revisions based on feedback
- Commit final document

---

## 🏁 PHASE: MERGE & CLEANUP (MANDATORY)

**After documentation is complete, ASK THE USER:**

```
🏁 DOCUMENTATION COMPLETE - READY TO MERGE

Created/Updated:
- /docs/features/<feature>-implementation-plan.md
- [list any @implements comments added]

Branch: docs/<feature-name>
Worktree: ../worktrees/docs-<feature-name>

Actions to perform:
1. Push branch to remote
2. Merge to main (or create PR)
3. Clean up worktree

Proceed with merge and cleanup? (yes/no/pr-only)
```

**If "yes" (direct merge):**
```bash
git push -u origin docs/<feature-name>

cd <original-repo-path>
git fetch origin
git checkout main
git pull origin main
git merge --no-ff docs/<feature-name> -m "docs: Add <feature> implementation plan"
git push origin main

git worktree remove ../worktrees/docs-<feature-name>
git branch -d docs/<feature-name>
git push origin --delete docs/<feature-name>
```

**If "pr-only" (create PR):**
```bash
git push -u origin docs/<feature-name>
gh pr create --title "docs: Add <feature> implementation plan" --body "<description>"
```

**Confirm to user:**
```
✅ MERGE & CLEANUP COMPLETE
   ✓ Documentation merged to main (or PR created)
   ✓ Pushed to remote
   ✓ Worktree removed
   ✓ Branch cleaned up

Returned to main repository.
```

---

## ❓ INITIAL QUESTIONS

Before I begin, please provide:

1. **Feature Name** (for filename): `[feature name]-implementation-plan.md`
2. **Feature Location** (where in the app):
   - Menu path
   - Main component location
   - API endpoints base path

3. **Implementation Status**:
   - [ ] Fully Implemented
   - [ ] Partially Implemented
   - [ ] Needs Documentation Only

---

## 🚀 READY TO BEGIN

**Starting Step 0: Worktree Setup**

I will now:
1. Check for existing worktrees (`git worktree list`)
2. Ask which worktree to use or create new
3. Then proceed to documentation process

**Proceeding with worktree check...**
