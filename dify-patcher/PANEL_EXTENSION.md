# Custom Panel Extension Guide

This document explains how custom panels are automatically loaded and registered in Dify.

## Overview

The `dify-patcher` system automatically discovers and loads custom panels from the `_custom` directory, eliminating the need to manually modify Dify's core code.

## How It Works

### 1. Auto-Discovery Mechanism

When Dify's frontend builds, it automatically:

1. **Scans** the `_custom` directory for custom nodes
2. **Imports** each node's `frontend/index.ts` file
3. **Registers** `NodeComponent` and `PanelComponent` in the component maps

This is achieved through a **git patch** applied to `/web/app/components/workflow/nodes/components.ts`:

```typescript
// Auto-loader code added by patch
try {
  const customNodesContext = require.context('./_custom', true, /frontend\/index\.(ts|tsx|js|jsx)$/)

  customNodesContext.keys().forEach((key: string) => {
    const module = customNodesContext(key)

    if (module.nodeType && module.NodeComponent) {
      NodeComponentMap[module.nodeType] = module.NodeComponent
    }

    if (module.nodeType && module.PanelComponent) {
      PanelComponentMap[module.nodeType] = module.PanelComponent
    }
  })
} catch (error) {
  console.info('[dify-patcher] No custom nodes found')
}
```

### 2. Directory Structure

```
/web/app/components/workflow/nodes/
├── _custom/  ← Symlink to dify-patcher/nodes
│   ├── weather-api/
│   │   └── frontend/
│   │       ├── index.ts       ← Exports NodeComponent & PanelComponent
│   │       ├── panel.tsx      ← Your custom panel
│   │       ├── node.tsx       ← Canvas node component
│   │       └── ...
│   ├── advanced-panel-example/
│   └── my-custom-node/
└── components.ts  ← Patched with auto-loader
```

### 3. Required Exports

Each custom node's `frontend/index.ts` **must export**:

```typescript
// Required exports for auto-discovery
export const nodeType: string          // Node type identifier
export const NodeComponent: FC<NodeProps>  // Canvas component
export const PanelComponent: FC<PanelProps> // Panel component
```

**Complete example:**

```typescript
// frontend/index.ts
import manifest from '../manifest.json'

export { MyCustomNode as NodeComponent } from './node'
export { MyCustomPanel as PanelComponent } from './panel'
export { myCustomDefault as defaultConfig } from './default'

export const nodeType = manifest.node_type
export { manifest }
```

## Installation Process

### 1. Apply the Patch

The installer automatically applies the panel auto-loader patch:

```bash
cd /home/user/dify/dify-patcher
cd installer/cli && npm start -- install --target ../../dify --mode dev
```

This:
1. Applies `001-custom-panel-loader.patch` to Dify core
2. Creates symlink `/web/app/components/workflow/nodes/_custom`

### 2. Verify Installation

Check that the patch was applied:

```bash
cd /home/user/dify
git diff web/app/components/workflow/nodes/components.ts
```

You should see the auto-loader code at the end of the file.

## Creating Custom Panels

### Quick Start

Use the node creation script:

```bash
cd /home/user/dify/dify-patcher
./scripts/create-node.sh my-awesome-node
```

This generates:
- ✅ Correct export structure in `frontend/index.ts`
- ✅ Panel template in `frontend/panel.tsx`
- ✅ Node component in `frontend/node.tsx`
- ✅ Type definitions in `frontend/types.ts`

### Manual Panel Creation

**1. Create panel component (`frontend/panel.tsx`):**

```typescript
import React from 'react'
import type { FC } from 'react'
import { useConfig } from './use-config'
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Input from '@/app/components/workflow/nodes/_base/components/input'

export const MyCustomPanel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="mt-2">
      <div className="space-y-4 px-4 pb-4">
        <Field title="Name" required>
          <Input
            value={inputs.name}
            onChange={handleFieldChange('name')}
            placeholder="Enter name"
          />
        </Field>
      </div>
    </div>
  )
}

export default React.memo(MyCustomPanel)
```

**2. Export in `frontend/index.ts`:**

```typescript
import manifest from '../manifest.json'

// Export with exact names
export { MyCustomNode as NodeComponent } from './node'
export { MyCustomPanel as PanelComponent } from './panel'
export { myCustomDefault as defaultConfig } from './default'

export const nodeType = manifest.node_type
export { manifest }
```

**3. Test:**

```bash
cd /home/user/dify/web
pnpm dev
```

Open workflow editor → Your custom node → Click node → Panel appears!

## Panel Component Reference

### Available UI Components

All Dify panel components are available:

```typescript
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Input from '@/app/components/workflow/nodes/_base/components/input'
import Textarea from '@/app/components/workflow/nodes/_base/components/textarea'
import Select from '@/app/components/workflow/nodes/_base/components/select'
import Switch from '@/app/components/workflow/nodes/_base/components/switch'
import { VarReferencePicker } from '@/app/components/workflow/nodes/_base/components/variable'
import CodeEditor from '@/app/components/workflow/nodes/_base/components/code-editor'
import InputNumberWithSlider from '@/app/components/workflow/nodes/_base/components/input-number-with-slider'
import Collapse from '@/app/components/workflow/nodes/_base/components/collapse'
```

See [panel-components.md](./conventions/panel-components.md) for complete reference.

### State Management

Use the `useConfig` hook for state management:

```typescript
import { useConfig } from './use-config'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  // Update a field
  handleFieldChange('fieldName')('newValue')

  // Access current values
  console.log(inputs.fieldName)
}
```

## Hot Reload

In development mode, panel changes are hot-reloaded:

1. Edit `frontend/panel.tsx`
2. Save file
3. Panel updates immediately in browser

No restart needed! ✨

## Debugging

### Panel Not Showing

**Check 1: Exports**
```typescript
// Verify frontend/index.ts has these exports
export const nodeType
export const NodeComponent
export const PanelComponent  // ← Must be exported
```

**Check 2: Console**
```bash
# Open browser console
# Look for errors like:
[dify-patcher] Failed to load custom node from ...
```

**Check 3: Component Map**
```javascript
// In browser console
console.log(window.__DIFY_PANEL_MAP__)
// Should include your nodeType
```

### Panel Rendering Errors

Enable React DevTools and check for:
- Missing imports
- Type errors
- Hook errors (useConfig must be at top level)

## Examples

### Example 1: Simple Form Panel

```typescript
const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="space-y-4">
      <Field title="Name" required>
        <Input value={inputs.name} onChange={handleFieldChange('name')} />
      </Field>
      <Field title="Email">
        <Input type="email" value={inputs.email} onChange={handleFieldChange('email')} />
      </Field>
    </div>
  )
}
```

### Example 2: Panel with Variable Selection

```typescript
import { useAvailableVarList } from '@/app/components/workflow/nodes/_base/hooks/use-available-var-list'
import { VarReferencePicker } from '@/app/components/workflow/nodes/_base/components/variable'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)
  const { availableVars } = useAvailableVarList(id)

  return (
    <Field title="Input Variable">
      <VarReferencePicker
        nodeId={id}
        availableVars={availableVars}
        value={inputs.variable}
        onChange={handleFieldChange('variable')}
      />
    </Field>
  )
}
```

### Example 3: Advanced Panel

See [`advanced-panel-example`](./nodes/advanced-panel-example/) for a complete reference implementation showing:
- All input types
- Variable selection
- Conditional rendering
- Dynamic lists
- Validation
- Code editor

## Best Practices

### ✅ DO

- Export `PanelComponent` in `frontend/index.ts`
- Use `useConfig` hook for state
- Wrap inputs in `Field` components
- Memoize panel with `React.memo`
- Use TypeScript for type safety
- Filter variables by type
- Provide tooltips for complex fields

### ❌ DON'T

- Don't use local state (`useState`) for node data
- Don't forget to export `nodeType`
- Don't hardcode text (use i18n)
- Don't skip Field wrapper
- Don't modify core Dify files

## Troubleshooting

### Patch Not Applied or Symlink Missing

```bash
# Re-run installer
cd /home/user/dify/dify-patcher/installer/cli
npm start -- install --target ../../dify --mode dev
```

### TypeScript Errors

```bash
cd /home/user/dify/web
pnpm type-check
```

## Further Reading

- [Panel Components Reference](./conventions/panel-components.md) - All UI components
- [Custom Panel Guide](./conventions/custom-panel-guide.md) - Development tutorials
- [Frontend Patterns](./conventions/frontend-patterns.md) - Architecture
- [Variable System](./conventions/variable-system.md) - Variable handling

---

**Last Updated**: 2024-11-15
**Status**: Production-ready
