# Tabulator Best Practices

This document contains lessons learned and best practices for using Tabulator in Kitchen48.

---

## Installation

```bash
cd frontend && npm install tabulator-tables
```

---

## Dynamic Loading Pattern (REQUIRED)

Always load Tabulator dynamically to avoid SSR/build issues:

```typescript
import { useEffect, useRef, useState } from 'react';

const [tabulatorLoaded, setTabulatorLoaded] = useState(false);
const tableRef = useRef<HTMLDivElement>(null);
const tabulatorRef = useRef<any>(null);

// Step 1: Load module dynamically
useEffect(() => {
  import('tabulator-tables')
    .then((module) => {
      (window as any).TabulatorModule = module.TabulatorFull;
      setTabulatorLoaded(true);
    });
}, []);

// Step 2: Initialize after load
useEffect(() => {
  if (!tabulatorLoaded || !tableRef.current || tabulatorRef.current) return;

  const Tabulator = (window as any).TabulatorModule;
  tabulatorRef.current = new Tabulator(tableRef.current, {
    height: "100%",
    layout: "fitData",
    columns: [/* ... */],
  });
}, [tabulatorLoaded]);
```

---

## Event Handlers - CRITICAL LESSON LEARNED

### Use `on()` Method for Event Callbacks

**IMPORTANT**: Do NOT define event callbacks (like `cellEdited`) in the options object. They may not fire reliably.

**WRONG - May not work:**
```typescript
const options = {
  columns: columns,
  cellEdited: function(cell) {  // This callback may not fire!
    handleUpdate(cell);
  },
};
new Tabulator(element, options);
```

**CORRECT - Use on() method:**
```typescript
const options = {
  columns: columns,
  // Do NOT put cellEdited here
};
const table = new Tabulator(element, options);

// Attach event handlers via on() method AFTER creation
table.on('cellEdited', function(cell) {
  handleUpdate(cell);
});
```

### Common Events to Attach via on()

```typescript
// Cell editing
table.on('cellEdited', function(cell) {
  const row = cell.getRow();
  const data = row.getData();
  saveToAPI(data);
});

// Row click
table.on('rowClick', function(e, row) {
  const data = row.getData();
  handleRowClick(data);
});

// Data loaded
table.on('dataLoaded', function(data) {
  console.log('Data loaded:', data.length, 'rows');
});
```

---

## Container Sizing (CRITICAL)

Proper container sizing is essential for scrolling:

```tsx
<div style={{
  height: '500px',       // or calc(100vh - 280px)
  minHeight: '400px',
  minWidth: 0,           // CRITICAL for horizontal scroll in flex
  overflow: 'hidden'     // prevent double scrollbars
}}>
  <div ref={tableRef} style={{ height: '100%', width: '100%' }}></div>
</div>
```

---

## Column Configuration

### Editable Columns

```typescript
const columns = [
  {
    title: 'Name',
    field: 'name',
    editor: 'input',                    // Inline text editing
    validator: ['required', 'minLength:1'],
    headerFilter: 'input',              // Filter in header
    sorter: 'string',
    width: 150,
  },
  {
    title: 'Type',
    field: 'type',
    editor: 'list',
    editorParams: {
      values: ['option1', 'option2', 'option3']
    },
  },
  {
    title: 'Active',
    field: 'isActive',
    editor: 'tickCross',                // Boolean checkbox
    formatter: 'tickCross',
    hozAlign: 'center',
  }
];
```

### Read-Only Columns

Simply omit the `editor` property:

```typescript
{
  title: 'Email',
  field: 'email',
  // No editor = read-only
  headerFilter: 'input',
  sorter: 'string',
}
```

### Date Columns

**IMPORTANT**: The `datetime` sorter requires luxon.js. Use `string` sorter instead to avoid dependency issues:

```typescript
{
  title: 'Created',
  field: 'createdAt',
  formatter: function(cell) {
    const value = cell.getValue();
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
  sorter: 'string',  // NOT 'datetime' - avoids luxon dependency
}
```

---

## Data Loading Pattern

```typescript
const loadData = async () => {
  const token = localStorage.getItem('auth_token');

  const response = await fetch('/api/endpoint', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'  // Always get fresh data
  });

  if (!response.ok) throw new Error('Failed to load');

  const data = await response.json();
  tabulatorRef.current?.setData(data.data || []);
};
```

---

## Inline Editing with Auto-Save

```typescript
// After creating Tabulator instance
table.on('cellEdited', async function(cell) {
  const row = cell.getRow();
  const data = row.getData();

  try {
    await saveToAPI(data);
  } catch (error) {
    // Reload data to reset on error (rollback)
    const freshData = await loadData();
    table.setData(freshData);
  }
});
```

---

## Backend Validation for Tabulator Data

### Empty String Handling

**IMPORTANT**: Tabulator sends empty strings `""` when a field is cleared. Backend validation must handle this.

Use `z.preprocess()` to convert empty strings to null before Zod validation:

```typescript
const emptyStringToNull = (val: unknown) => (val === '' ? null : val);

export const updateSchema = z.object({
  firstName: z.preprocess(emptyStringToNull, z.string().min(1).optional().nullable()),
  lastName: z.preprocess(emptyStringToNull, z.string().min(1).optional().nullable()),
  // ... other fields
});
```

Without this, `z.string().min(1)` will reject empty strings, causing silent validation failures.

---

## Theme Styling

Create a `tabulator-theme.css` using CSS variables only (no hardcoded colors):

```css
/* DO: Use CSS variables */
.tabulator {
  background-color: var(--bg-primary) !important;
  color: var(--text-primary) !important;
}

.tabulator .tabulator-header {
  background-color: var(--bg-secondary) !important;
  border-bottom: 1px solid var(--border-color) !important;
}

.tabulator .tabulator-row:hover {
  background-color: var(--bg-hover) !important;
}

/* DON'T: Hardcode colors */
/* background-color: #ffffff;  <-- WRONG */
```

---

## TypeScript Support

```typescript
import type { TabulatorFull, ColumnDefinition } from 'tabulator-tables';

// Declare module on window
declare global {
  interface Window {
    TabulatorModule: typeof TabulatorFull;
  }
}

// Type your columns
const columns: ColumnDefinition[] = [
  { title: 'Name', field: 'name', sorter: 'string' },
];
```

---

## Cleanup on Unmount

Always clean up Tabulator instances to prevent memory leaks:

```typescript
useEffect(() => {
  // ... initialization code ...

  // Cleanup
  return () => {
    tabulatorRef.current?.destroy();
    tabulatorRef.current = null;
  };
}, [tabulatorLoaded]);
```

---

## Common Tabulator Options Reference

```typescript
const options = {
  height: "100%",
  layout: "fitData",           // or "fitColumns", "fitDataFill"
  responsiveLayout: "collapse",
  pagination: true,
  paginationSize: 20,
  movableColumns: true,
  resizableColumns: true,
  placeholder: "No Data Available",
  initialSort: [
    { column: 'createdAt', dir: 'desc' },
  ],
};
```

---

## Troubleshooting

### Events not firing
- Use `table.on('eventName', handler)` instead of putting handlers in options

### DateTime sorter errors
- Install luxon.js OR use `sorter: 'string'` instead of `sorter: 'datetime'`

### Validation errors on empty fields
- Add `z.preprocess(emptyStringToNull, ...)` wrapper in Zod schemas

### Scroll not working
- Ensure container has explicit height
- Add `minWidth: 0` and `minHeight: 0` to flex containers

### Data not saving
- Check browser Network tab for API errors
- Check backend logs for validation errors
- Ensure auth token is being sent correctly

---

## Implementation Date

2026-01-30
