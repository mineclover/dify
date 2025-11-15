# Custom Panel Development Guide

Complete step-by-step guide to developing custom panels for Dify workflow nodes.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Panel Structure](#panel-structure)
4. [Step-by-Step Tutorial](#step-by-step-tutorial)
5. [Advanced Patterns](#advanced-patterns)
6. [Real-World Examples](#real-world-examples)
7. [Testing & Debugging](#testing--debugging)
8. [Best Practices](#best-practices)

---

## Overview

### What is a Panel?

A panel is the configuration UI that appears on the right side when a user clicks a node in the workflow canvas.

```
┌─────────────────┬─────────────────────┐
│                 │  ← PANEL            │
│   Workflow      │                     │
│   Canvas        │  Configuration UI   │
│                 │  for selected node  │
│   [Node] ←──────│                     │
│   [Node]        │                     │
│                 │                     │
└─────────────────┴─────────────────────┘
```

### Panel Components

Every custom panel consists of:

1. **panel.tsx** - Panel component (configuration UI)
2. **use-config.ts** - State management hook
3. **types.ts** - TypeScript type definitions

---

## Quick Start

### Minimal Panel Example

The simplest possible custom panel:

**frontend/panel.tsx:**
```typescript
import type { FC } from 'react'
import React from 'react'
import type { NodePanelProps } from '../types'
import { useConfig } from './use-config'
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Input from '@/app/components/workflow/nodes/_base/components/input'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="space-y-4">
      <Field title="Message">
        <Input
          value={inputs.message}
          onChange={handleFieldChange('message')}
          placeholder="Enter message"
        />
      </Field>
    </div>
  )
}

export default React.memo(Panel)
```

**frontend/use-config.ts:**
```typescript
import { useCallback } from 'react'
import produce from 'immer'
import { useStoreApi } from 'reactflow'

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

**frontend/types.ts:**
```typescript
export interface MyNodeData {
  message: string
}

export interface NodePanelProps {
  id: string
  data: MyNodeData
}
```

---

## Panel Structure

### Complete File Structure

```
my-custom-node/
├── manifest.json
├── backend/
│   ├── __init__.py
│   └── node.py
└── frontend/
    ├── index.ts          # Exports
    ├── types.ts          # Type definitions
    ├── node.tsx          # Canvas node component
    ├── panel.tsx         # ← PANEL COMPONENT
    ├── use-config.ts     # ← STATE MANAGEMENT
    └── default.ts        # Default values
```

### Panel Lifecycle

```
User clicks node
       ↓
node.data.selected = true
       ↓
Panel component renders
       ↓
useConfig hook initializes
       ↓
User edits field
       ↓
handleFieldChange called
       ↓
Node data updated in ReactFlow state
       ↓
Panel re-renders with new data
```

---

## Step-by-Step Tutorial

### Tutorial 1: Simple Text Input Panel

**Goal:** Create a panel with a single text input.

**Step 1: Define Types**

```typescript
// frontend/types.ts
export interface SimpleNodeData {
  title: string
  message: string
}

export interface NodePanelProps {
  id: string
  data: SimpleNodeData
}
```

**Step 2: Create State Hook**

```typescript
// frontend/use-config.ts
import { useCallback } from 'react'
import produce from 'immer'
import { useStoreApi } from 'reactflow'
import type { SimpleNodeData } from './types'

export const useConfig = (id: string, data: SimpleNodeData) => {
  const store = useStoreApi()

  const handleFieldChange = useCallback((field: keyof SimpleNodeData) => {
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

**Step 3: Create Panel Component**

```typescript
// frontend/panel.tsx
import type { FC } from 'react'
import React from 'react'
import type { NodePanelProps } from './types'
import { useConfig } from './use-config'
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Input from '@/app/components/workflow/nodes/_base/components/input'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="space-y-4">
      <Field
        title="Message"
        tooltip="Enter your message"
        required
      >
        <Input
          value={inputs.message}
          onChange={handleFieldChange('message')}
          placeholder="Hello, world!"
        />
      </Field>
    </div>
  )
}

export default React.memo(Panel)
```

**Step 4: Export Panel**

```typescript
// frontend/index.ts
import Panel from './panel'

export const nodeType = 'simple-node'
export const NodeComponent = /* ... */
export const PanelComponent = Panel
```

**Result:** A functional panel with one text input field.

---

### Tutorial 2: Multiple Input Types

**Goal:** Panel with text, number, and select inputs.

```typescript
// frontend/types.ts
export interface MultiInputNodeData {
  title: string
  name: string
  age: number
  country: string
}
```

```typescript
// frontend/panel.tsx
import type { FC } from 'react'
import React from 'react'
import { useConfig } from './use-config'
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Input from '@/app/components/workflow/nodes/_base/components/input'
import Select from '@/app/components/workflow/nodes/_base/components/select'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="space-y-4">
      {/* Text Input */}
      <Field title="Name" required>
        <Input
          value={inputs.name}
          onChange={handleFieldChange('name')}
          placeholder="Enter name"
        />
      </Field>

      {/* Number Input */}
      <Field title="Age">
        <Input
          type="number"
          value={inputs.age}
          onChange={handleFieldChange('age')}
          placeholder="25"
        />
      </Field>

      {/* Select Dropdown */}
      <Field title="Country">
        <Select
          value={inputs.country}
          onChange={handleFieldChange('country')}
          options={[
            { value: 'us', label: 'United States' },
            { value: 'uk', label: 'United Kingdom' },
            { value: 'jp', label: 'Japan' },
            { value: 'kr', label: 'South Korea' }
          ]}
        />
      </Field>
    </div>
  )
}

export default React.memo(Panel)
```

---

### Tutorial 3: Variable Selection

**Goal:** Panel that allows selecting variables from workflow.

```typescript
// frontend/types.ts
export interface VarNodeData {
  title: string
  input_variable: string[]  // Variable selector
}
```

```typescript
// frontend/panel.tsx
import type { FC } from 'react'
import React from 'react'
import { useConfig } from './use-config'
import { useAvailableVarList } from '../_base/hooks/use-available-var-list'
import Field from '@/app/components/workflow/nodes/_base/components/field'
import { VarReferencePicker } from '@/app/components/workflow/nodes/_base/components/variable'
import { VarType } from '@/app/components/workflow/types'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  // Get available variables from workflow
  const { availableVars } = useAvailableVarList(id, {
    // Filter to only show string variables
    filterVar: (varPayload) => {
      return varPayload.type === VarType.String
    }
  })

  return (
    <div className="space-y-4">
      <Field
        title="Input Variable"
        tooltip="Select a variable from the workflow"
        required
      >
        <VarReferencePicker
          nodeId={id}
          isShowNodeName
          availableVars={availableVars}
          value={inputs.input_variable}
          onChange={handleFieldChange('input_variable')}
          placeholder="Select variable"
        />
      </Field>
    </div>
  )
}

export default React.memo(Panel)
```

---

### Tutorial 4: Text with Variable Insertion

**Goal:** Text input that supports `{{#variable#}}` syntax.

```typescript
// frontend/panel.tsx
import { InputSupportSelectVar } from '@/app/components/workflow/nodes/_base/components/variable'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)
  const { availableVars } = useAvailableVarList(id)

  return (
    <div className="space-y-4">
      <Field title="Message Template">
        <InputSupportSelectVar
          nodeId={id}
          value={inputs.message}
          onChange={handleFieldChange('message')}
          availableVars={availableVars}
          multiline
          rows={5}
          placeholder="Hello {{#user.name#}}, your order {{#order.id#}} is ready!"
        />
      </Field>
    </div>
  )
}
```

**User Experience:**
- User types `Hello {{` → dropdown appears with available variables
- User selects `user.name` → inserts `{{#user.name#}}`
- Result: `Hello {{#user.name#}}, welcome!`

---

### Tutorial 5: Code Editor

**Goal:** Panel with code editor for Python/JavaScript.

```typescript
// frontend/panel.tsx
import CodeEditor from '@/app/components/workflow/nodes/_base/components/code-editor'
import Select from '@/app/components/workflow/nodes/_base/components/select'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <Field title="Language">
        <Select
          value={inputs.language}
          onChange={handleFieldChange('language')}
          options={[
            { value: 'python', label: 'Python' },
            { value: 'javascript', label: 'JavaScript' },
            { value: 'json', label: 'JSON' }
          ]}
        />
      </Field>

      {/* Code Editor */}
      <Field title="Code">
        <CodeEditor
          value={inputs.code}
          onChange={handleFieldChange('code')}
          language={inputs.language}
          height={400}
        />
      </Field>
    </div>
  )
}
```

---

### Tutorial 6: Dynamic Lists

**Goal:** Add/remove items dynamically.

```typescript
// frontend/types.ts
export interface ListNodeData {
  title: string
  items: string[]
}
```

```typescript
// frontend/panel.tsx
import { useState } from 'react'
import Button from '@/app/components/base/button'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  const handleAddItem = () => {
    handleFieldChange('items')([...inputs.items, ''])
  }

  const handleRemoveItem = (index: number) => {
    handleFieldChange('items')(inputs.items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...inputs.items]
    newItems[index] = value
    handleFieldChange('items')(newItems)
  }

  return (
    <div className="space-y-4">
      <Field
        title="Items"
        operations={
          <Button size="sm" onClick={handleAddItem}>
            + Add Item
          </Button>
        }
      >
        <div className="space-y-2">
          {inputs.items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(value) => handleItemChange(index, value)}
                placeholder={`Item ${index + 1}`}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveItem(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Field>
    </div>
  )
}
```

---

## Advanced Patterns

### Pattern 1: Conditional Fields

Show/hide fields based on configuration:

```typescript
const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <Field title="Mode">
        <Select
          value={inputs.mode}
          onChange={handleFieldChange('mode')}
          options={[
            { value: 'simple', label: 'Simple' },
            { value: 'advanced', label: 'Advanced' }
          ]}
        />
      </Field>

      {/* Simple Mode Fields */}
      {inputs.mode === 'simple' && (
        <Field title="Quick Message">
          <Input
            value={inputs.quickMessage}
            onChange={handleFieldChange('quickMessage')}
          />
        </Field>
      )}

      {/* Advanced Mode Fields */}
      {inputs.mode === 'advanced' && (
        <>
          <Field title="Template">
            <Textarea
              value={inputs.template}
              onChange={handleFieldChange('template')}
              rows={5}
            />
          </Field>
          <Field title="Variables">
            <VarList
              nodeId={id}
              list={inputs.variables}
              onChange={handleFieldChange('variables')}
            />
          </Field>
        </>
      )}
    </div>
  )
}
```

---

### Pattern 2: Collapsible Sections

Organize complex panels with collapsible sections:

```typescript
import Collapse from '@/app/components/workflow/nodes/_base/components/collapse'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="space-y-4">
      {/* Basic Configuration */}
      <Field title="API Key">
        <Input
          type="password"
          value={inputs.apiKey}
          onChange={handleFieldChange('apiKey')}
        />
      </Field>

      {/* Advanced Options (Collapsed by default) */}
      <Collapse title="Advanced Options" defaultOpen={false}>
        <div className="space-y-4 pt-4">
          <Field title="Timeout">
            <Input
              type="number"
              value={inputs.timeout}
              onChange={handleFieldChange('timeout')}
            />
          </Field>
          <Field title="Retry Count">
            <Input
              type="number"
              value={inputs.retryCount}
              onChange={handleFieldChange('retryCount')}
            />
          </Field>
        </div>
      </Collapse>

      {/* Headers (Collapsed) */}
      <Collapse title="Custom Headers" defaultOpen={false}>
        <VarList
          nodeId={id}
          list={inputs.headers}
          onChange={handleFieldChange('headers')}
        />
      </Collapse>
    </div>
  )
}
```

---

### Pattern 3: Validation

Add validation with error messages:

```typescript
import { useState, useEffect } from 'react'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate on change
  const validateUrl = (url: string) => {
    if (!url.trim()) {
      return 'URL is required'
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'URL must start with http:// or https://'
    }
    return null
  }

  const handleUrlChange = (value: string) => {
    const error = validateUrl(value)
    setErrors(prev => ({ ...prev, url: error || '' }))
    handleFieldChange('url')(value)
  }

  return (
    <div className="space-y-4">
      <Field title="API URL" required>
        <Input
          value={inputs.url}
          onChange={handleUrlChange}
          placeholder="https://api.example.com"
          className={errors.url ? 'border-red-500' : ''}
        />
        {errors.url && (
          <div className="text-xs text-red-500 mt-1">
            {errors.url}
          </div>
        )}
      </Field>
    </div>
  )
}
```

---

### Pattern 4: Custom Helpers

Create reusable helper hooks:

```typescript
// frontend/use-config.ts
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

  // Helper: Update multiple fields at once
  const handleBulkChange = useCallback((updates: Record<string, any>) => {
    const { getNodes, setNodes } = store.getState()
    const nodes = getNodes()
    const newNodes = produce(nodes, (draft) => {
      const node = draft.find(n => n.id === id)
      if (node) {
        Object.entries(updates).forEach(([key, value]) => {
          node.data[key] = value
        })
      }
    })
    setNodes(newNodes)
  }, [id, store])

  // Helper: Reset to defaults
  const handleReset = useCallback((defaults: any) => {
    handleBulkChange(defaults)
  }, [handleBulkChange])

  return {
    inputs: data,
    handleFieldChange,
    handleBulkChange,
    handleReset
  }
}
```

**Usage:**
```typescript
const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange, handleReset } = useConfig(id, data)

  return (
    <div className="space-y-4">
      {/* Fields */}
      <Field title="Name">
        <Input value={inputs.name} onChange={handleFieldChange('name')} />
      </Field>

      {/* Reset Button */}
      <Button onClick={() => handleReset({ name: '', age: 0 })}>
        Reset to Defaults
      </Button>
    </div>
  )
}
```

---

### Pattern 5: Internationalization (i18n)

Support multiple languages:

```typescript
import { useTranslation } from 'react-i18next'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { t } = useTranslation()
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="space-y-4">
      <Field
        title={t('workflow.nodes.myNode.name')}
        tooltip={t('workflow.nodes.myNode.nameTooltip')}
        required
      >
        <Input
          value={inputs.name}
          onChange={handleFieldChange('name')}
          placeholder={t('workflow.nodes.myNode.namePlaceholder')}
        />
      </Field>
    </div>
  )
}
```

**Translation file (web/i18n/en-US/workflow.ts):**
```typescript
{
  workflow: {
    nodes: {
      myNode: {
        name: 'Name',
        nameTooltip: 'Enter your name',
        namePlaceholder: 'John Doe'
      }
    }
  }
}
```

---

## Real-World Examples

### Example 1: HTTP Request Panel

Complete panel for HTTP request node:

```typescript
// frontend/panel.tsx
import type { FC } from 'react'
import React from 'react'
import { useConfig } from './use-config'
import { useAvailableVarList } from '../_base/hooks/use-available-var-list'
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Select from '@/app/components/workflow/nodes/_base/components/select'
import { InputSupportSelectVar } from '@/app/components/workflow/nodes/_base/components/variable'
import { VarList } from '@/app/components/workflow/nodes/_base/components/variable'
import Collapse from '@/app/components/workflow/nodes/_base/components/collapse'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)
  const { availableVars } = useAvailableVarList(id)

  return (
    <div className="space-y-4">
      {/* HTTP Method */}
      <Field title="Method">
        <Select
          value={inputs.method}
          onChange={handleFieldChange('method')}
          options={[
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' }
          ]}
        />
      </Field>

      {/* URL with variable support */}
      <Field title="URL" required>
        <InputSupportSelectVar
          nodeId={id}
          value={inputs.url}
          onChange={handleFieldChange('url')}
          availableVars={availableVars}
          placeholder="https://api.example.com/{{#endpoint#}}"
        />
      </Field>

      {/* Headers */}
      <Collapse title="Headers" defaultOpen={false}>
        <VarList
          nodeId={id}
          list={inputs.headers}
          onChange={handleFieldChange('headers')}
          availableVars={availableVars}
        />
      </Collapse>

      {/* Body (for POST/PUT) */}
      {['POST', 'PUT'].includes(inputs.method) && (
        <Field title="Body">
          <InputSupportSelectVar
            nodeId={id}
            value={inputs.body}
            onChange={handleFieldChange('body')}
            availableVars={availableVars}
            multiline
            rows={10}
          />
        </Field>
      )}

      {/* Timeout */}
      <Field title="Timeout (seconds)">
        <Input
          type="number"
          value={inputs.timeout}
          onChange={handleFieldChange('timeout')}
          placeholder="30"
        />
      </Field>
    </div>
  )
}

export default React.memo(Panel)
```

---

### Example 2: LLM Configuration Panel

Advanced panel with model selection, prompt, and parameters:

```typescript
import InputNumberWithSlider from '@/app/components/workflow/nodes/_base/components/input-number-with-slider'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)
  const { availableVars } = useAvailableVarList(id)

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <Field title="Model">
        <Select
          value={inputs.model}
          onChange={handleFieldChange('model')}
          options={[
            { value: 'gpt-4', label: 'GPT-4' },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
            { value: 'claude-3', label: 'Claude 3' }
          ]}
        />
      </Field>

      {/* Prompt */}
      <Field title="Prompt" required>
        <InputSupportSelectVar
          nodeId={id}
          value={inputs.prompt}
          onChange={handleFieldChange('prompt')}
          availableVars={availableVars}
          multiline
          rows={10}
          placeholder="Enter your prompt with {{#variables#}}"
        />
      </Field>

      {/* Temperature */}
      <Field title="Temperature" tooltip="Controls randomness (0-2)">
        <InputNumberWithSlider
          value={inputs.temperature}
          onChange={handleFieldChange('temperature')}
          min={0}
          max={2}
          step={0.1}
        />
      </Field>

      {/* Max Tokens */}
      <Field title="Max Tokens">
        <Input
          type="number"
          value={inputs.maxTokens}
          onChange={handleFieldChange('maxTokens')}
          placeholder="2048"
        />
      </Field>

      {/* Advanced Parameters */}
      <Collapse title="Advanced" defaultOpen={false}>
        <div className="space-y-4 pt-4">
          <Field title="Top P">
            <InputNumberWithSlider
              value={inputs.topP}
              onChange={handleFieldChange('topP')}
              min={0}
              max={1}
              step={0.01}
            />
          </Field>
          <Field title="Frequency Penalty">
            <InputNumberWithSlider
              value={inputs.frequencyPenalty}
              onChange={handleFieldChange('frequencyPenalty')}
              min={0}
              max={2}
              step={0.1}
            />
          </Field>
        </div>
      </Collapse>
    </div>
  )
}
```

---

## Testing & Debugging

### Testing Your Panel

**1. Visual Testing:**
```bash
cd /home/user/dify/web
pnpm dev
```
- Navigate to workflow editor
- Add your custom node
- Click node to open panel
- Test all inputs

**2. Data Persistence Testing:**
```typescript
// Add console.log to see data changes
const handleFieldChange = (field: string) => {
  return (value: any) => {
    console.log(`Field "${field}" changed to:`, value)
    // ... update logic
  }
}
```

**3. Type Checking:**
```bash
cd web
pnpm type-check
```

### Common Issues

**Issue 1: Panel Not Appearing**

```typescript
// ❌ Wrong: Not exported
export default Panel

// ✅ Correct: Export as PanelComponent
export const PanelComponent = Panel
```

**Issue 2: Changes Not Persisting**

```typescript
// ❌ Wrong: Local state
const [value, setValue] = useState('')

// ✅ Correct: Use useConfig hook
const { inputs, handleFieldChange } = useConfig(id, data)
```

**Issue 3: Variables Not Available**

```typescript
// ❌ Wrong: No filtering
const { availableVars } = useAvailableVarList(id)

// ✅ Correct: Filter by type
const { availableVars } = useAvailableVarList(id, {
  filterVar: (v) => v.type === VarType.String
})
```

---

## Best Practices

### ✅ DO

1. **Use Field wrapper for all inputs**
   ```typescript
   <Field title="Name">
     <Input ... />
   </Field>
   ```

2. **Memoize panel component**
   ```typescript
   export default React.memo(Panel)
   ```

3. **Use i18n for all text**
   ```typescript
   const { t } = useTranslation()
   <Field title={t('workflow.nodes.myNode.name')} />
   ```

4. **Filter variables by type**
   ```typescript
   const { availableVars } = useAvailableVarList(id, {
     filterVar: (v) => v.type === VarType.String
   })
   ```

5. **Provide helpful tooltips**
   ```typescript
   <Field title="API Key" tooltip="Get your API key from dashboard" />
   ```

6. **Use placeholder text**
   ```typescript
   <Input placeholder="https://api.example.com" />
   ```

### ❌ DON'T

1. **Don't hardcode text**
   ```typescript
   // ❌ Wrong
   <Field title="Name">

   // ✅ Correct
   <Field title={t('workflow.nodes.myNode.name')}>
   ```

2. **Don't use local state for node data**
   ```typescript
   // ❌ Wrong
   const [value, setValue] = useState('')

   // ✅ Correct
   const { inputs, handleFieldChange } = useConfig(id, data)
   ```

3. **Don't forget required indicators**
   ```typescript
   // ❌ Wrong
   <Field title="Required Field">

   // ✅ Correct
   <Field title="Required Field" required>
   ```

4. **Don't render all variables without filtering**
   ```typescript
   // ❌ Wrong - overwhelming for users
   <VarReferencePicker availableVars={allVars} />

   // ✅ Correct - filtered
   <VarReferencePicker availableVars={stringVarsOnly} />
   ```

---

## Checklist

Before committing your panel:

- [ ] All text uses i18n (`t()` function)
- [ ] Component is memoized with `React.memo`
- [ ] Uses `useConfig` hook (not local state)
- [ ] All inputs wrapped in `Field` component
- [ ] Required fields marked with `required` prop
- [ ] Tooltips provided for complex fields
- [ ] Variables filtered by appropriate type
- [ ] TypeScript types defined correctly
- [ ] Tested in both light and dark mode
- [ ] Tested data persistence (refresh page)
- [ ] No console errors or warnings

---

## See Also

- [Panel Components Reference](./panel-components.md) - All available components
- [Frontend Patterns](./frontend-patterns.md) - UI architecture
- [Variable System](./variable-system.md) - Variable selection
- [Common Mistakes](./common-mistakes.md) - Avoid pitfalls

---

## Next Steps

1. Read [Panel Components Reference](./panel-components.md) for detailed component API
2. Check [weather-api](../nodes/weather-api/) for real working example
3. Use `./scripts/create-node.sh` to generate panel template
4. Test your panel in dev environment

---

**Last Updated**: 2024-11-15
**Version**: 1.0.0
