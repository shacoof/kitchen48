# Workflows Workflow

You are now in workflow mode.

## Task Description
{TASK_DESCRIPTION}

---


# Available Workflows

Here are the workflows currently available in this project. You can trigger them by typing the command or asking for them by name.

## Development Constraints
| Command | Description | When to use |
|---------|-------------|-------------|
| **/react-dev** | **Development with Compliance** | **ALWAYS** when writing code. Enforces guidelines, pre-edit commits, and @implements checking. |
| **/bug-fix** | **Bug Investigation** | When fixing a bug. Enforces systematic investigation, root cause analysis, and regression testing. |
| **/feature-update** | **Feature Update** | When updating an existing feature. |
| **/document-feature** | **Documentation Generator** | When creating or updating `docs/features/*-implementation-plan.md`. |

## Utility
| Command | Description |
|---------|-------------|
| **/workflows** | Shows this list |

## How to use

**Strict Command:**
```
/react-dev Add export button
```

**Natural Language:**
"Please use the react dev workflow to add an export button"

**Syncing:**
If you add commands to `.claude/commands`, run `npm run sync-workflows` to update this list.
