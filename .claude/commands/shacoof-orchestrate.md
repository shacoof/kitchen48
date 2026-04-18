# Orchestrate — Workflow Selection & Compliance Gate

You are now in **Orchestration Mode**. This is a mandatory pre-work gate that ensures the correct workflow is selected and all project conventions are followed before any work begins.

## Task Description
$ARGUMENTS

---

# STEP 1: READ ALL ORCHESTRATOR INSTRUCTIONS (MANDATORY)

**You MUST read and internalize the following files before proceeding. Do NOT skip any.**

### 1.1 Read Orchestrator Configuration

```
Read: .orchestrator.json
```

**Extract and display:**
- Project name and tech stack
- Available workflow types and their stages
- Worktree configuration
- Deployment configuration

### 1.2 Read Project CLAUDE.md

```
Read: CLAUDE.md (root)
```

**Extract and display:**
- Mandatory workflow checklist
- Database safety rules
- Key conventions (logging, i18n, auto-save, responsive design)

### 1.3 Read Global CLAUDE.md

```
Read: ~/CLAUDE.md
```

**Extract and display:**
- Git Worktree Workflow rules
- Worktree naming conventions
- Merge/cleanup procedures

---

# STEP 2: REVIEW ALL EXISTING SKILLS (MANDATORY)

**List every skill available in this session.** These are the skills shown in the system reminder (e.g., `shacoof-react-dev`, `shacoof-bug-fix`, etc.).

**Display to the user:**

```
📚 AVAILABLE SKILLS

| # | Skill Name | Type | Description |
|---|------------|------|-------------|
| 1 | /shacoof-react-dev | Workflow | React development with compliance enforcement |
| 2 | /shacoof-bug-fix | Workflow | Systematic bug investigation & resolution |
| 3 | /shacoof-feature-update | Workflow | Feature modification with change tracking |
| 4 | /shacoof-deploy-to-production | Deployment | One-click production deployment |
| 5 | /shacoof-workflows | Reference | Lists all available workflows |
| ... | [any other skills] | ... | ... |
```

**Also list any non-workflow skills** (e.g., `claude-api`, `simplify`, `update-config`, etc.) that could be relevant.

---

# STEP 3: REVIEW ALL EXISTING SLASH COMMANDS (MANDATORY)

**Read the commands directory:**

```
Read: .claude/commands/README.md
List: .claude/commands/*.md
```

**Display to the user:**

```
📂 EXISTING SLASH COMMANDS

| # | Command File | Purpose | Key Phases |
|---|-------------|---------|------------|
| 1 | shacoof-react-dev.md | New feature development | Plan → Approve → Commit → Code → Test → Merge |
| 2 | shacoof-bug-fix.md | Bug investigation & fix | Investigate → Plan → Approve → Fix → Test → Merge |
| 3 | shacoof-feature-update.md | Modify existing features | Document Current → Plan → Approve → Update → Test → Merge |
| 4 | shacoof-deploy-to-production.md | Deploy to GCP | Validate → Build → Deploy → Migrate → Verify |
| 5 | shacoof-workflows.md | Reference card | Lists all workflows |
| 6 | shacoof-orchestrate.md | This command | Pre-work gate |
```

---

# STEP 4: TASK ANALYSIS & WORKFLOW RECOMMENDATION (MANDATORY)

**Analyze the task described in $ARGUMENTS and present your recommendation.**

### 4.1 Task Classification

**Display to the user:**

```
🔍 TASK ANALYSIS

Task: $ARGUMENTS

Classification:
- [ ] New Feature — Something that doesn't exist yet
- [ ] Bug Fix — Something is broken / not working as expected
- [ ] Feature Update — Changing behavior of existing working functionality
- [ ] Deployment — Push current code to production
- [ ] Research / Investigation — No code changes needed
- [ ] Other — Doesn't fit existing workflows

Rationale: [Explain WHY you chose this classification]
```

### 4.2 Recommended Workflow

**Display to the user:**

```
🎯 RECOMMENDED WORKFLOW

Primary workflow: /shacoof-[workflow-name]
Reason: [Why this workflow is the right fit]

Orchestrator pipeline stages that apply:
[List the stages from .orchestrator.json for this workflow type]

Additional skills/commands that may be needed:
- [List any supporting skills, e.g., /shacoof-deploy-to-production after merge]

Conventions that specifically apply to this task:
- [ ] Worktree isolation (always)
- [ ] Pre-edit commit (always)
- [ ] i18n / translations (if UI text changes)
- [ ] Responsive design (if frontend changes)
- [ ] Auto-save pattern (if form changes)
- [ ] Statistics tracking (if new user interactions)
- [ ] Database migrations (if schema changes)
- [ ] Data migrations (if new reference data)
- [ ] Module CLAUDE.md update (if module changes)
- [ ] [Any other relevant conventions]
```

### 4.3 Execution Plan Summary

**Display to the user:**

```
📋 EXECUTION PLAN

I will execute the following sequence:

1. Invoke: /shacoof-[workflow-name] $ARGUMENTS
2. Follow all phases of that workflow (list them)
3. [Any additional steps, e.g., deploy after merge]

What I will NOT do:
- [List anything explicitly out of scope]
```

---

# STEP 5: APPROVAL CHECKPOINT (MANDATORY — DO NOT PROCEED WITHOUT APPROVAL)

**Display to the user:**

```
⏸️ APPROVAL REQUIRED

I have completed my analysis:
✅ Orchestrator instructions read
✅ All skills reviewed
✅ All slash commands reviewed
✅ Task classified
✅ Workflow recommended
✅ Execution plan prepared

May I proceed with the recommended workflow?

Options:
  yes     — Start the recommended workflow
  no      — Cancel, do not proceed
  adjust  — Modify the plan (tell me what to change)
  other   — Use a different workflow (specify which)
```

**CRITICAL: Do NOT invoke any workflow or make any code changes until the user explicitly approves.**

---

# STEP 6: EXECUTE APPROVED WORKFLOW

**Only after receiving explicit approval:**

1. Invoke the approved workflow skill using the Skill tool
2. Follow that workflow's phases completely — no shortcuts
3. If the workflow has its own approval checkpoints, honor those too

---

## ⚠️ RULES

- ❌ NEVER skip Steps 1-5
- ❌ NEVER start coding before approval
- ❌ NEVER invoke a workflow without presenting the analysis first
- ❌ NEVER assume which workflow to use — always analyze and recommend
- ❌ NEVER skip the worktree setup (enforced by the sub-workflow)
- ✅ ALWAYS read orchestrator config, skills, and commands first
- ✅ ALWAYS present classification and recommendation
- ✅ ALWAYS wait for explicit user approval
- ✅ ALWAYS follow the approved workflow end-to-end

---

## 🎯 SUCCESS CRITERIA

A successful orchestration includes:
1. ✅ All orchestrator files read and understood
2. ✅ All skills and commands listed for the user
3. ✅ Task correctly classified with rationale
4. ✅ Appropriate workflow recommended with reasoning
5. ✅ Relevant conventions identified
6. ✅ User approved the plan before any work began
7. ✅ Approved workflow executed completely with no shortcuts
