# Document Feature Workflow

You are now in workflow mode.

## Task Description
{TASK_DESCRIPTION}

---


# Document Feature Workflow

You are now in workflow mode.

## Task Description
[task description]

---


# Document Feature Workflow

You are now in workflow mode.

## Task Description
[task description]

---


# Feature Documentation Generator

You are now in **Feature Documentation Mode**. Your task is to create a comprehensive implementation plan document for a feature following the established template structure.

## Task Description
[feature name]

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

## 🎯 OBJECTIVE

Create a detailed implementation plan document at `/docs/features/[feature name]-implementation-plan.md` that follows the established structure from existing feature documentation (e.g., `user-management-implementation-plan.md`, `genai-prompts-implementation-plan.md`).

---

## 📋 REQUIRED INFORMATION GATHERING

Before creating the document, I need to gather the following information from you or the codebase:

### 1. Feature Overview
- [ ] Feature name and purpose
- [ ] Implementation status (Complete/In Progress/Planned)
- [ ] Implementation date
- [ ] Brief description (1-2 sentences)

### 2. Functional Description & Screen Behavior
- [ ] Screen purpose and role in application
- [ ] Screen layout (wireframe/mockup)
- [ ] Page load sequence and default states
- [ ] User interaction behaviors (clicks, keyboard, hover)
- [ ] Field-specific behaviors (input types, validations)
- [ ] Error handling and recovery
- [ ] State management structure
- [ ] Data flow between components
- [ ] User workflows (step-by-step scenarios)
- [ ] Performance considerations (caching, lazy loading)
- [ ] Accessibility features

### 3. Requirements
- [ ] User requirements (what users need)
- [ ] Technical requirements (what the system needs)
- [ ] Role-based access requirements
- [ ] Field visibility rules
- [ ] Validation rules
- [ ] Business logic constraints

### 4. Architecture
- [ ] File structure (which files were created/modified)
- [ ] Component descriptions and responsibilities
- [ ] API endpoint specifications
- [ ] Data flow and state management
- [ ] Integration points

### 5. Data Model
- [ ] Existing tables/models used
- [ ] Schema changes (if any)
- [ ] Relationships and foreign keys
- [ ] Constraints and validations

### 6. Permissions
- [ ] Menu item configuration
- [ ] Role capabilities matrix (SysAdmin, OrgAdmin, Planner, General)
- [ ] Permission checks at API level
- [ ] Permission checks at UI level

### 7. Translations
- [ ] All translation keys added
- [ ] English and Hebrew mappings
- [ ] Organized by namespace
- [ ] Where translations were seeded

### 8. Theme Tokens
- [ ] List of theme tokens used
- [ ] New tokens created (if any)
- [ ] Token categories (layout, colors, typography, etc.)

### 9. Compliance
- [ ] Multi-tenancy (organization filtering)
- [ ] Permission system integration
- [ ] Internationalization (i18n)
- [ ] Central logging
- [ ] Theme tokens usage
- [ ] Tab dirty state tracking (if applicable)
- [ ] Data preservation (migrations)

### 10. Implementation Steps
- [ ] Chronological list of what was done
- [ ] Pre-edit commits
- [ ] Database migrations
- [ ] API creation/updates
- [ ] Component creation
- [ ] Translation seeding
- [ ] Testing performed

### 11. Known Issues & Fixes (if applicable)
- [ ] Issue descriptions with dates
- [ ] Root cause analysis
- [ ] Fixes applied
- [ ] Lessons learned
- [ ] Guideline updates made
- [ ] Commit references

### 12. File-to-Plan Mapping (@implements verification)
- [ ] List ALL source files that implement this feature
- [ ] Verify each has `@implements` comment
- [ ] Check comments reference the correct implementation plan
- [ ] Generate compliance report

**Verification Table**:
| File | Has @implements? | Correct Plan? | Action Needed |
|------|------------------|---------------|---------------|
| [file1] | ✅/❌ | ✅/❌/N/A | [action] |

### 13. Testing
- [ ] Test cases executed
- [ ] Role-based testing results
- [ ] Multi-language testing results
- [ ] Edge cases tested

---

## 📝 DOCUMENT STRUCTURE TEMPLATE

I will create the document following this structure:

```markdown
# {Feature Name} - Implementation Plan

## Overview
Brief description, status, date, compliance rate

---

## Functional Description & Screen Behavior

### Screen Purpose
High-level description of what the screen does and its role in the application

### Screen Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ASCII wireframe showing the visual structure                 │
│ of the screen components                                     │
└─────────────────────────────────────────────────────────────┘
```

### Interaction Behaviors

#### Page Load
1. Initial loading sequence
2. Data fetching behavior
3. Success/error handling
4. Default state

#### User Actions
- Click behaviors
- Keyboard interactions (Enter, Escape, Tab)
- Hover effects
- Drag-and-drop (if applicable)

#### Field-Specific Behaviors
| Field | Input Type | Special Behavior |
|-------|------------|------------------|
| Field1 | Type | Notes |
| Field2 | Type | Notes |

#### Error Handling
- Network errors
- Validation errors
- Permission errors
- Recovery behaviors

### State Management
```typescript
// Component state structure
state1: type    // description
state2: type    // description
```

### Data Flow
1. Component A → fetches data
2. Component B → receives props
3. Component C → handles updates

### User Workflows

#### Workflow 1: [Name]
1. Step 1
2. Step 2
3. Expected outcome

#### Workflow 2: [Name]
1. Step 1
2. Step 2
3. Expected outcome

### Performance Considerations
- Caching strategy
- Lazy loading
- Optimistic updates
- Network optimization

### Accessibility Features
- Keyboard navigation
- Focus management
- Screen reader support
- Visual feedback

---

## Requirements

### User Requirements
- Requirement 1
- Requirement 2

### Technical Requirements
- Requirement 1
- Requirement 2

---

## Architecture

### File Structure
```
src/
├── app/
│   ├── api/
│   └── {feature-name}/
└── features/
    └── {feature-name}/
```

### Components
1. Component 1: Description and responsibilities
2. Component 2: Description and responsibilities

### API Endpoints
- GET /api/{resource}
- POST /api/{resource}
- PUT /api/{resource}/:id
- DELETE /api/{resource}/:id

---

## Data Model

### Existing Tables Used
- Table1: fields
- Table2: fields

### Schema Changes
None required / Description of changes

---

## Permissions

### Menu Item Configuration
```typescript
{
  name: '',
  path: '',
  permissions: {...}
}
```

### Role Capabilities Matrix
| Action | SysAdmin | OrgAdmin | Planner | General |
|--------|----------|----------|---------|---------|
| View   | ✅       | ...      | ...     | ...     |

---

## Translations

### Translation Keys Added
- key1: "English" / "עברית"
- key2: "English" / "עברית"

---

## Theme Tokens

### Tokens Used
- Layout & Spacing
- Colors
- Typography

---

## Compliance Checklist

- [x] Multi-Tenancy
- [x] Permission System
- [x] Internationalization
- [x] Central Logging
- [x] Theme Tokens
- [x] Tab Dirty State
- [x] Data Preservation

---

## Implementation Steps

1. Step 1 ✅
2. Step 2 ✅

---

## Known Issues & Fixes

### Issue #1: Description
**Date**: YYYY-MM-DD
**Severity**: High/Medium/Low
**Root Cause**: ...
**Fix Applied**: ...
**Lesson Learned**: ...
**Guideline Updated**: ...

---

## File-to-Plan Mapping

### Files Implementing This Feature
| File | Purpose | Has @implements |
|------|---------|-----------------|
| `src/app/api/{feature}/route.ts` | API endpoints | ✅ |
| `src/features/{feature}/Component.tsx` | Main UI component | ✅ |

### @implements Compliance
- [x] All feature files have `@implements` comment
- [x] All comments reference this implementation plan
- [x] Validation script passes: `npx tsx scripts/verify-implements.ts`

---

## Testing Plan

### Test Cases
- [x] Test case 1
- [x] Test case 2

---

## Reference Implementation

### Key Files
- File1: Description
- File2: Description

### Code Patterns to Reference
- Pattern 1
- Pattern 2

---

## Compliance Summary
Summary with percentage
```

---

## 🔍 INFORMATION GATHERING PROCESS

I will now:

1. **Ask you questions** about the feature to fill in missing information
2. **Search the codebase** to find:
   - API routes in `src/app/api/`
   - Components in `src/features/` and `src/app/`
   - Permission configurations in `src/lib/seed-permissions.ts`
   - Translation keys in `scripts/seed-ui-translations.ts`
   - Theme token usage in component files
   - Git commit history for the feature

3. **Analyze the code** to document:
   - Component architecture and data flow
   - API endpoint specifications
   - Permission checks
   - Translation usage
   - Compliance with guidelines

4. **Create the document** with all gathered information

---

## 📊 WORKFLOW STEPS

### Step 1: Discovery & Analysis
- Search for feature-related files
- Read API routes, components, and services
- Identify permission configurations
- Find translation keys
- Review git commits related to the feature
- **Check @implements comments** in all discovered files
- **Run validation**: `npx tsx scripts/verify-implements.ts`

### Step 2: Interview (if needed)
- Ask clarifying questions about:
  - Original requirements
  - Design decisions
  - Known issues encountered
  - Lessons learned
  - Testing performed

### Step 3: @implements Remediation
- For files MISSING `@implements` comment:
  - Add the comment referencing this implementation plan
  - Commit changes with message: "chore: add @implements comments for {feature}"
- For files with INCORRECT `@implements`:
  - Update to include this implementation plan
  - Commit changes
- Document all files in the File-to-Plan Mapping section

### Step 4: Document Creation
- Create comprehensive markdown document
- Follow established template structure
- Include code examples where helpful
- Add commit references for traceability
- Include File-to-Plan Mapping section

### Step 5: Review & Refinement
- Present document for your review
- Make revisions based on feedback
- Commit final document with descriptive message

---

## ❓ INITIAL QUESTIONS

Before I begin searching the codebase, please provide:

1. **Feature Name** (for filename): `[feature name]-implementation-plan.md`
2. **Feature Location** (where in the app):
   - Menu path (e.g., `/settings/user-management`)
   - Main component location
   - API endpoints base path

3. **Implementation Status**:
   - [ ] Fully Implemented
   - [ ] Partially Implemented
   - [ ] Needs Documentation Only

4. **Known Issues** (if any):
   - Were there any bugs fixed during or after implementation?
   - Were any lessons learned documented?

5. **Special Requirements**:
   - Are there any unique aspects of this feature that should be highlighted?
   - Any complex patterns or solutions worth documenting as reference?

---

## 🚀 READY TO BEGIN

Once you provide the above information, I will:

1. Search the codebase for all relevant files
2. Analyze the architecture and implementation
3. Create a comprehensive implementation plan document
4. Add it to `/docs/features/` with proper commit message

**Please provide the feature details to begin the documentation process.**
