# Dify Custom Nodes - TypeScript SDK

A TypeScript/React SDK for developing custom workflow nodes for Dify with a clean, type-safe API.

## Installation

```bash
pnpm install
pnpm build
```

## Quick Start

```tsx
import {
  createNodeComponent,
  createPanelComponent,
  useConfig,
  type CustomNodeData,
} from '@dify/custom-nodes-sdk'

// 1. Define your node data type
interface HelloWorldNodeData extends CustomNodeData {
  name: string
}

// 2. Create canvas node component
export const HelloWorldNode = createNodeComponent<HelloWorldNodeData>((props) => {
  const { data } = props

  if (!data.name) return null

  return (
    <div className="px-3 py-1">
      <div className="text-xs text-gray-600">
        👋 {data.name}
      </div>
    </div>
  )
})

// 3. Create configuration panel
export const HelloWorldPanel = createPanelComponent<HelloWorldNodeData>((props) => {
  const { id, data } = props
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <Field title="Name">
      <Input
        value={inputs.name}
        onChange={handleFieldChange('name')}
        placeholder="Enter name..."
      />
    </Field>
  )
})

// 4. Export manifest and registration
export const manifest = {
  node_type: 'hello-world',
  version: '1',
  name: 'Hello World',
  description: 'A simple greeting node',
  author: 'Your Name',
  icon: '👋',
}

export const nodeType = 'hello-world'
export const NodeComponent = HelloWorldNode
export const PanelComponent = HelloWorldPanel
```

## Features

- **Type Safety**: Full TypeScript support with strict typing
- **React Components**: Use React for UI rendering
- **Auto-sync**: Configuration changes automatically sync to backend
- **Helper Hooks**: `useConfig` hook simplifies state management
- **Component Creators**: `createNodeComponent` and `createPanelComponent` reduce boilerplate

## API Reference

### Components

#### `createNodeComponent<T>(render)`

Creates a canvas node component with automatic wrapping.

```tsx
const MyNode = createNodeComponent<MyNodeData>((props) => {
  const { data } = props
  return <div>{data.myField}</div>
})
```

#### `createPanelComponent<T>(render)`

Creates a configuration panel component.

```tsx
const MyPanel = createPanelComponent<MyNodeData>((props) => {
  const { id, data } = props
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <Field title="My Field">
      <Input value={inputs.myField} onChange={handleFieldChange('myField')} />
    </Field>
  )
})
```

### Hooks

#### `useConfig<T>(id, data)`

Hook for managing node configuration with automatic sync.

```tsx
const { inputs, handleFieldChange, handleBulkChange } = useConfig(id, data)

// Update single field
<Input onChange={handleFieldChange('myField')} />

// Update multiple fields
handleBulkChange({ field1: 'value1', field2: 'value2' })
```

## Examples

See the `../../nodes/` directory for complete examples.

## License

MIT
