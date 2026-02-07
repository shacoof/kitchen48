# Available Workflows

Here are the workflows currently available. You can trigger them by typing the command or asking for them by name.

**All workflows below follow the Git Worktree Workflow defined in ~/CLAUDE.md for parallel session safety.**

## Development Workflows

| Command | Description | When to use |
|---------|-------------|-------------|
| **/shacoof-react-dev** | **Development with Compliance** | **ALWAYS** when writing code. Enforces guidelines, pre-edit commits, worktree isolation, and module CLAUDE.md updates. |
| **/shacoof-bug-fix** | **Bug Investigation** | When fixing a bug. Enforces systematic investigation, root cause analysis, worktree isolation, and regression testing. |
| **/shacoof-feature-update** | **Feature Update** | When updating an existing feature. Includes worktree isolation and merge workflow. |
| **/shacoof-deploy-to-production** | **Production Deployment** | When deploying to Google Cloud. One-click deployment with database migrations. |

## Utility

| Command | Description |
|---------|-------------|
| **/shacoof-workflows** | Shows this list |

---

## Git Worktree Workflow Summary

**All development workflows enforce the following pattern:**

### At Session Start
1. Check for existing worktrees (`git worktree list`)
2. Ask user: use existing worktree OR create new one
3. Create/enter isolated worktree before any code changes

### After Testing Approved
1. Push branch to remote

### At Task Completion
1. Ask user: merge to main, create PR, or keep branch
2. Merge or create PR as requested
3. Clean up worktree
4. Delete branch (local and remote)

### Visual Indicators
```
🔍 WORKTREE CHECK      - Session start, checking existing worktrees
🌳 WORKTREE SETUP      - Creating new worktree
✅ WORKTREE CREATED    - Confirmation of new worktree
✅ USING EXISTING      - Using existing worktree
🏁 TASK COMPLETE       - Ready to merge and cleanup
✅ MERGE & CLEANUP     - Confirmation of successful merge
```

---

## How to Use

**Strict Command:**
```
/shacoof-react-dev Add export button
```

**Natural Language:**
"Please use the react dev workflow to add an export button"

---

## Global Configuration

The Git Worktree Workflow instructions are defined in:
- `~/CLAUDE.md` - Global worktree workflow rules

These slash commands are located in:
- `~/.claude/commands/` - Global commands available to all projects
