# Advanced Panel Example

This node is a **reference implementation** demonstrating all major panel UI patterns and components available for custom node development in Dify.

## Purpose

This example exists to showcase:

1. **All major UI component types** - text, textarea, select, switch, sliders, code editor, etc.
2. **Variable system integration** - selecting and inserting variables
3. **Advanced patterns** - conditional rendering, dynamic lists, collapsible sections, validation
4. **Best practices** - proper state management, memoization, type safety

**This is a learning resource, not a production node.**

---

## What's Demonstrated

### 1. Basic Input Components

```typescript
// Text input
<Input value={inputs.name} onChange={handleFieldChange('name')} />

// Textarea
<Textarea value={inputs.description} onChange={handleFieldChange('description')} />

// Select dropdown
<Select value={inputs.mode} onChange={handleFieldChange('mode')} options={...} />

// Boolean switch
<Switch value={inputs.enable_feature} onChange={handleFieldChange('enable_feature')} />

// Number with slider
<InputNumberWithSlider
  value={inputs.confidence}
  onChange={handleFieldChange('confidence')}
  min={0} max={1} step={0.05}
/>
```

### 2. Variable Selection

```typescript
// Get available variables with type filtering
const stringVars = useAvailableVarList(id, {
  filterVar: (v) => v.type === VarType.String
}).availableVars

// Variable picker
<VarReferencePicker
  nodeId={id}
  availableVars={stringVars}
  value={inputs.input_variable}
  onChange={handleFieldChange('input_variable')}
/>
```

### 3. Text with Variable Insertion

```typescript
// Supports {{#variable#}} syntax
<InputSupportSelectVar
  nodeId={id}
  value={inputs.message_template}
  onChange={handleFieldChange('message_template')}
  availableVars={availableVars}
  multiline
  placeholder="Hello {{#user.name#}}, your ID is {{#user.id#}}"
/>
```

### 4. Conditional Rendering

```typescript
// Show different fields based on mode selection
{inputs.mode === 'simple' && (
  <Field title="Quick Message">
    <Input value={inputs.quick_message} ... />
  </Field>
)}

{inputs.mode === 'advanced' && (
  <>
    <Field title="API URL">...</Field>
    <Field title="HTTP Method">...</Field>
  </>
)}

{inputs.mode === 'expert' && (
  <Field title="Custom Code">
    <CodeEditor language="python" ... />
  </Field>
)}
```

### 5. Dynamic Lists (Add/Remove Items)

```typescript
const handleAddItem = () => {
  handleFieldChange('custom_items')([...(inputs.custom_items || []), ''])
}

const handleRemoveItem = (index: number) => {
  handleFieldChange('custom_items')(
    (inputs.custom_items || []).filter((_, i) => i !== index)
  )
}

<Field title="Custom Items" operations={<Button onClick={handleAddItem}>+ Add</Button>}>
  {inputs.custom_items.map((item, index) => (
    <div key={index}>
      <Input value={item} onChange={(v) => handleItemChange(index, v)} />
      <Button onClick={() => handleRemoveItem(index)}>Remove</Button>
    </div>
  ))}
</Field>
```

### 6. Validation

```typescript
const [errors, setErrors] = useState<Record<string, string>>({})

const validateUrl = (url: string) => {
  if (!url.trim()) return 'URL is required'
  if (!url.startsWith('http')) return 'URL must start with http'
  return null
}

const handleUrlChange = (value: string) => {
  const error = validateUrl(value)
  setErrors(prev => ({ ...prev, url: error || '' }))
  handleFieldChange('url')(value)
}

<Input
  value={inputs.url}
  onChange={handleUrlChange}
  className={errors.url ? 'border-red-500' : ''}
/>
{errors.url && <div className="text-red-500">{errors.url}</div>}
```

### 7. Collapsible Sections

```typescript
<Collapse title="Advanced Options" defaultOpen={false}>
  <div className="space-y-4 pt-4">
    <Field title="Timeout">...</Field>
    <Field title="Retry Count">...</Field>
  </div>
</Collapse>
```

### 8. Code Editor

```typescript
<CodeEditor
  value={inputs.custom_code}
  onChange={handleFieldChange('custom_code')}
  language="python"
  height={300}
/>
```

---

## File Structure

```
advanced-panel-example/
├── manifest.json           # Node metadata
├── backend/
│   ├── __init__.py
│   └── node.py            # Backend implementation (basic)
├── frontend/
│   ├── index.ts           # Exports
│   ├── types.ts           # TypeScript types
│   ├── node.tsx           # Canvas node component
│   ├── panel.tsx          # ⭐ MAIN EXAMPLE - Panel UI
│   ├── use-config.ts      # State management hook
│   └── default.ts         # Default values
└── README.md              # This file
```

---

## Key Files to Study

### 1. `frontend/panel.tsx` (Primary Reference)

This is the **main file** to study. It demonstrates:

- All UI components in action
- Proper imports and setup
- State management patterns
- Variable handling
- Validation
- Conditional rendering
- Dynamic lists
- Organized section layout

**Read this file line by line** to understand how panels are built.

### 2. `frontend/use-config.ts` (State Management)

Shows the standard pattern for managing node state:

```typescript
export const useConfig = (id: string, data: any) => {
  const store = useStoreApi()

  const handleFieldChange = useCallback((field: string) => {
    return (value: any) => {
      const { getNodes, setNodes } = store.getState()
      const nodes = getNodes()
      const newNodes = produce(nodes, (draft) => {
        const node = draft.find(n => n.id === id)
        if (node)
          node.data[field] = value
      })
      setNodes(newNodes)
    }
  }, [id, store])

  return {
    inputs: data,
    handleFieldChange
  }
}
```

### 3. `frontend/types.ts` (Type Definitions)

Shows how to define comprehensive types for panel fields:

```typescript
export interface AdvancedPanelExampleNodeData extends CustomNodeData {
  type: 'advanced-panel-example'

  // All field types properly defined
  name?: string
  mode?: 'simple' | 'advanced' | 'expert'
  enable_feature?: boolean
  custom_items?: string[]
  // ... etc
}
```

---

## How to Use This Example

### For Learning

1. **Read the panel.tsx file** - Study each section
2. **Run it in Dify** - See the UI in action
3. **Modify it** - Change fields, add new ones, experiment
4. **Copy patterns** - Use sections as templates for your nodes

### For Development

Copy the patterns you need:

```bash
# Copy the entire panel structure
cp -r nodes/advanced-panel-example/frontend/panel.tsx nodes/my-node/frontend/

# Then modify to fit your needs
```

Or copy specific sections:

```typescript
// Copy just the dynamic list pattern
const handleAddItem = () => { ... }
const handleRemoveItem = (index: number) => { ... }
// ... rest of dynamic list code
```

---

## Testing the Example

### 1. Install (if not already)

```bash
cd /home/user/dify/dify-patcher
cd installer/cli && npm start -- install --target ../../dify --mode dev
```

### 2. Start Dify

```bash
# Terminal 1 - Backend
cd /home/user/dify
uv run --project api python -m flask run

# Terminal 2 - Frontend
cd /home/user/dify/web
pnpm dev
```

### 3. Use in Workflow

1. Open Dify workflow editor
2. Find "Advanced Panel Example" node
3. Click the node
4. Panel opens on right side
5. Experiment with all the UI components

---

## What to Observe

### UI Components

- **Text inputs** - Basic and validated
- **Textareas** - Single and multi-line
- **Dropdowns** - Mode selection
- **Switches** - Boolean toggles
- **Sliders** - Number with visual control
- **Variable pickers** - With type filtering
- **Code editor** - Syntax highlighting
- **Dynamic lists** - Add/remove items
- **Collapsible sections** - Organized layout

### Interactions

- **Mode changes** → Different fields appear/disappear
- **Variable selection** → Dropdown shows available variables
- **Variable insertion** → Type `{{` to see variable picker
- **Add/Remove items** → List dynamically updates
- **Validation** → Errors appear for invalid URLs
- **Collapse/Expand** → Sections fold/unfold

### State Persistence

- **Change values** → Close panel → Reopen → Values persist
- **Refresh page** → Configuration saved to workflow
- **Export workflow** → All settings included

---

## Common Patterns Used

### Pattern 1: Field Wrapper

All inputs wrapped in `Field` component for consistent layout:

```typescript
<Field title="Label" tooltip="Help text" required>
  <Input ... />
</Field>
```

### Pattern 2: useConfig Hook

Standard state management:

```typescript
const { inputs, handleFieldChange } = useConfig(id, data)
```

### Pattern 3: Variable Filtering

Filter variables by type before showing picker:

```typescript
const stringVars = useAvailableVarList(id, {
  filterVar: (v) => v.type === VarType.String
}).availableVars
```

### Pattern 4: Conditional Rendering

Show fields based on configuration:

```typescript
{inputs.mode === 'advanced' && <AdvancedFields />}
```

### Pattern 5: Dynamic Arrays

Add/remove items from lists:

```typescript
// Add
handleFieldChange('items')([...inputs.items, newItem])

// Remove
handleFieldChange('items')(inputs.items.filter((_, i) => i !== index))

// Update
const newItems = [...inputs.items]
newItems[index] = value
handleFieldChange('items')(newItems)
```

---

## Differences from Production Nodes

This example node is **intentionally comprehensive** to demonstrate many patterns. Real production nodes typically:

1. **Use fewer components** - Only what's needed
2. **Have focused purpose** - One clear task
3. **Include backend logic** - Actual processing
4. **Use i18n** - Internationalized text
5. **Have specific validation** - Domain-specific rules

---

## Next Steps

After studying this example:

1. **Read** [`conventions/panel-components.md`](../../conventions/panel-components.md) for complete component API reference
2. **Read** [`conventions/custom-panel-guide.md`](../../conventions/custom-panel-guide.md) for step-by-step development guide
3. **Study** [`weather-api`](../weather-api/) for a real production-ready example
4. **Create** your own custom node using `./scripts/create-node.sh`

---

## Reference Documentation

- [Panel Components Reference](../../conventions/panel-components.md) - All available UI components
- [Custom Panel Guide](../../conventions/custom-panel-guide.md) - Development best practices
- [Frontend Patterns](../../conventions/frontend-patterns.md) - UI architecture
- [Variable System](../../conventions/variable-system.md) - Variable handling
- [Common Mistakes](../../conventions/common-mistakes.md) - Pitfalls to avoid

---

## Support

If you have questions about panel development:

1. Check the convention docs in `conventions/`
2. Study this example node
3. Look at `weather-api` for production patterns
4. Refer to Dify's core nodes in `/web/app/components/workflow/nodes/`

---

**Created**: 2024-11-15
**Purpose**: Educational reference for panel UI development
**Status**: Complete example showcasing all major patterns
