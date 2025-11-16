# Type System Integration

This document describes how dify-patcher integrates with Dify's type system to ensure full compatibility and type safety when building custom nodes.

## Overview

dify-patcher is designed to work as a **submodule** alongside the main Dify repository. This allows custom nodes to:

1. Import Dify's core types directly
2. Maintain full type compatibility with the workflow system
3. Avoid type duplication and drift
4. Get automatic type updates when Dify is updated

## Directory Structure

### Current Structure (Development)

```
/home/user/dify/
├── dify-patcher/          # Custom nodes repository
│   ├── tsconfig.json      # Root TypeScript config
│   ├── nodes/             # Custom node implementations
│   └── sdk/               # TypeScript SDK
└── web/                   # Dify frontend
    ├── app/components/workflow/types.ts
    └── types/workflow.ts
```

### Production Structure (Submodule)

```
/your-project/
├── dify/                  # Main Dify repository
│   └── web/
│       ├── app/components/workflow/types.ts
│       └── types/workflow.ts
└── dify-patcher/          # Custom nodes submodule
    ├── tsconfig.json
    ├── nodes/
    └── sdk/
```

## TypeScript Path Mapping

### Root Configuration

The root `tsconfig.json` configures path mappings to import Dify types:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@dify/types": [
        "../web/app/components/workflow/types",
        "../dify/web/app/components/workflow/types"
      ],
      "@dify/types/workflow": [
        "../web/types/workflow",
        "../dify/web/types/workflow"
      ]
    }
  }
}
```

**Why Two Paths?**
- First path: Works in current dev structure (`/home/user/dify/dify-patcher/`)
- Second path: Works when used as submodule (`/project/dify-patcher/`)

### SDK Configuration

The SDK's `tsconfig.json` extends the root config and adjusts paths for its location:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@dify/types": [
        "../../web/app/components/workflow/types",
        "../../../dify/web/app/components/workflow/types"
      ]
    }
  }
}
```

## Importing Dify Types

### In Custom Nodes

Custom nodes can import Dify types directly:

```typescript
// nodes/agno-agent/frontend/types.ts
import type { CommonNodeType, NodePanelProps } from '@dify/types'

export interface AgnoAgentNodeData extends CommonNodeType<{
  agno_base_url: string
  agent_id: string
  api_key: string
  message: string
}> {
  type: 'agno-agent'
}
```

### In Panel Components

```typescript
// nodes/agno-agent/frontend/panel.tsx
import type { NodePanelProps } from '@dify/types'
import type { AgnoAgentNodeData } from './types'

export const AgnoAgentPanel: FC<NodePanelProps<AgnoAgentNodeData>> = ({ id, data, panelProps }) => {
  // Full access to Dify's panel props and APIs
}
```

### In Node Components

```typescript
// nodes/agno-agent/frontend/node.tsx
import type { NodeProps } from '@dify/types'
import type { AgnoAgentNodeData } from './types'

export const AgnoAgentNode: FC<NodeProps<AgnoAgentNodeData>> = ({ id, data }) => {
  // Full access to Dify's node props
}
```

## Available Type Imports

### From `@dify/types`

Core workflow types from `web/app/components/workflow/types.ts`:

```typescript
import type {
  // Node types
  CommonNodeType,
  Node,
  NodeProps,
  NodePanelProps,

  // Edge types
  CommonEdgeType,
  Edge,

  // Enums
  BlockEnum,
  ErrorHandleMode,

  // Utility types
  ValueSelector,
  Variable,
  Branch,
} from '@dify/types'
```

### From `@dify/types/workflow`

Workflow runtime types from `web/types/workflow.ts`:

```typescript
import type {
  PanelProps,
  NodeTracing,
  FileResponse,
} from '@dify/types/workflow'
```

### From `@dify/components/*`

Dify UI components (for direct import if needed):

```typescript
import Field from '@dify/components/workflow/nodes/_base/components/field'
import Input from '@dify/components/workflow/nodes/_base/components/input'
```

## SDK Type Re-exports

The SDK (`sdk/typescript/src/types.ts`) re-exports Dify types for convenience:

```typescript
// SDK re-exports Dify's core types
export type {
  CommonNodeType,
  NodePanelProps as DifyNodePanelProps,
  NodeProps as DifyNodeProps,
  Node,
  BlockEnum,
} from '@dify/types'

// SDK also provides compatibility types
export interface CustomNodeData { /* ... */ }
export interface NodePanelProps<T> { /* ... */ }
```

**When to Use SDK Types vs. Dify Types:**
- **Prefer Dify types** (`@dify/types`) for full compatibility
- **Use SDK types** only for standalone/testing scenarios

## Type Compatibility

### CommonNodeType Structure

Dify's `CommonNodeType<T>` is a generic type that merges:

```typescript
type CommonNodeType<T = {}> = {
  // Core fields
  title: string
  desc: string
  type: BlockEnum
  selected?: boolean
  width?: number
  height?: number

  // Connection state (managed by Dify)
  _connectedSourceHandleIds?: string[]
  _connectedTargetHandleIds?: string[]

  // Runtime state (managed by Dify)
  _runningStatus?: NodeRunningStatus
  _isSingleRun?: boolean
  _singleRunningStatus?: NodeRunningStatus

  // Iteration/Loop state
  isInIteration?: boolean
  iteration_id?: string
  isInLoop?: boolean
  loop_id?: string

  // Error handling
  error_strategy?: ErrorHandleTypeEnum
  retry_config?: WorkflowRetryConfig
  default_value?: DefaultValueForm[]

  // ... and many more fields
} & T & Partial<PluginDefaultValue>
```

Your custom node extends this with specific fields:

```typescript
interface MyNodeData extends CommonNodeType<{
  my_field: string
  my_optional_field?: number
}> {
  type: 'my-node'
}
```

### NodePanelProps Structure

```typescript
type NodePanelProps<T> = {
  id: string                    // Node ID
  data: CommonNodeType<T>       // Node data with your custom fields
  panelProps: PanelProps        // Dify's panel utilities
}
```

The `panelProps` object provides:
- `getInputVars(textList: string[]): InputVar[]` - Get input variables
- `toVarInputs(variables: Variable[]): InputVar[]` - Convert to input vars
- `runInputData: Record<string, any>` - Runtime input data

## Best Practices

### 1. Always Extend CommonNodeType

```typescript
// ✅ Good: Full Dify compatibility
interface MyNodeData extends CommonNodeType<{
  myField: string
}> {
  type: 'my-node'
}

// ❌ Bad: Missing Dify fields
interface MyNodeData {
  type: 'my-node'
  myField: string
}
```

### 2. Use Dify's NodePanelProps

```typescript
// ✅ Good: Access to panelProps utilities
const Panel: FC<NodePanelProps<MyNodeData>> = ({ id, data, panelProps }) => {
  const inputVars = panelProps.getInputVars(['text1', 'text2'])
}

// ❌ Bad: Missing panelProps
const Panel: FC<{ id: string; data: MyNodeData }> = ({ id, data }) => {
  // Can't access panel utilities
}
```

### 3. Specify Node Type Explicitly

```typescript
// ✅ Good: Type is specified and matches node_type in manifest
interface MyNodeData extends CommonNodeType<{...}> {
  type: 'my-node'  // Must match manifest.json node_type
}

// ❌ Bad: Generic type field
interface MyNodeData extends CommonNodeType<{...}> {
  type: string
}
```

### 4. Import from @dify/types

```typescript
// ✅ Good: Direct Dify import
import type { CommonNodeType, NodePanelProps } from '@dify/types'

// ⚠️ Acceptable: SDK import (for compatibility)
import type { CustomNodeData } from '../../../sdk/typescript/src/types'

// ❌ Bad: Local type definition
type CommonNodeType = { title: string; desc: string; ... }
```

## Troubleshooting

### Type Not Found

**Error:** `Cannot find module '@dify/types'`

**Solution:**
1. Check `tsconfig.json` has correct path mappings
2. Verify Dify repository is at the expected location
3. Ensure TypeScript is using the correct config file

### Type Mismatch

**Error:** `Type 'MyNodeData' is not assignable to type 'CommonNodeType<T>'`

**Solution:**
1. Ensure your interface extends `CommonNodeType<{...}>`
2. Check all required fields are present (title, desc, type)
3. Verify type field matches node_type in manifest.json

### Path Resolution

**Error:** Module resolution fails in different environments

**Solution:**
The dual-path configuration handles both:
- Development: `../web/...`
- Production: `../dify/web/...`

TypeScript tries the first path, then falls back to the second.

## Migration Guide

### From SDK Types to Dify Types

**Before:**
```typescript
import type { CustomNodeData, NodePanelProps } from '../../../sdk/typescript/src/types'

export interface MyNodeData extends CustomNodeData {
  type: 'my-node'
  myField: string
}
```

**After:**
```typescript
import type { CommonNodeType, NodePanelProps } from '@dify/types'

export interface MyNodeData extends CommonNodeType<{
  myField: string
}> {
  type: 'my-node'
}
```

### Updating Panel Components

**Before:**
```typescript
import type { NodePanelProps } from '../../../sdk/typescript/src/types'

const Panel: FC<NodePanelProps<MyNodeData>> = ({ id, data }) => {
  // Limited panel functionality
}
```

**After:**
```typescript
import type { NodePanelProps } from '@dify/types'

const Panel: FC<NodePanelProps<MyNodeData>> = ({ id, data, panelProps }) => {
  // Full access to Dify panel utilities
  const inputVars = panelProps.getInputVars([...])
}
```

## Future Considerations

### When Dify Updates Types

The type system integration automatically picks up changes when:
1. Dify repository is updated (git pull)
2. TypeScript recompiles
3. No changes needed in custom nodes (if changes are backward compatible)

### Breaking Changes

If Dify makes breaking type changes:
1. TypeScript will report compilation errors
2. Update custom node types to match new Dify types
3. Test thoroughly before deployment

### Standalone Mode

For scenarios where dify-patcher is used without Dify:
- SDK provides fallback `CustomNodeData` type
- Compatible but with reduced functionality
- Recommended only for testing/development

## Examples

### Complete Node Type Definition

```typescript
// nodes/my-node/frontend/types.ts
import type { CommonNodeType } from '@dify/types'

export interface MyNodeData extends CommonNodeType<{
  // Required fields
  api_url: string
  api_key: string
  query: string

  // Optional fields
  timeout?: number
  retry?: boolean
  max_retries?: number

  // Advanced fields
  headers?: Record<string, string>
  body?: any
}> {
  type: 'my-node'
}
```

### Complete Panel Component

```typescript
// nodes/my-node/frontend/panel.tsx
import type { FC } from 'react'
import type { NodePanelProps } from '@dify/types'
import type { MyNodeData } from './types'
import { useConfig } from './use-config'

export const MyNodePanel: FC<NodePanelProps<MyNodeData>> = ({
  id,
  data,
  panelProps
}) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  // Use panelProps for advanced functionality
  const inputVars = panelProps.getInputVars(['query'])

  return (
    <div>
      {/* Panel UI */}
    </div>
  )
}
```

## Summary

The type system integration provides:

✅ **Full Type Safety** - Compile-time checking with Dify types
✅ **Zero Duplication** - Import directly from Dify
✅ **Automatic Updates** - Changes sync when Dify is updated
✅ **Backward Compatibility** - Dual-path configuration works in all environments
✅ **Developer Experience** - Autocomplete and IntelliSense for all Dify APIs

For questions or issues with type integration, see [ARCHITECTURE.md](./ARCHITECTURE.md) or open an issue.
