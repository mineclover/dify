# Edge and Handle Connection Patterns

Complete guide to edge connections and handle management in Dify workflow nodes.

## Table of Contents

1. [Handle Basics](#handle-basics)
2. [Handle ID Conventions](#handle-id-conventions)
3. [Node Connection Types](#node-connection-types)
4. [Backend Edge Representation](#backend-edge-representation)
5. [Frontend Handle Implementation](#frontend-handle-implementation)
6. [Connection State Management](#connection-state-management)
7. [Advanced Patterns](#advanced-patterns)

---

## Handle Basics

### What are Handles?

Handles are the connection points on workflow nodes that allow data flow between nodes.

**Two types:**
- **Source (Output)**: Right side of node, sends data out
- **Target (Input)**: Left side of node, receives data in

### ReactFlow Handle Component

```typescript
import { Handle, Position } from 'reactflow'

<Handle
  id="unique-handle-id"
  type="source"  // or "target"
  position={Position.Right}  // or Position.Left
  className="custom-handle-class"
/>
```

---

## Handle ID Conventions

### Simple Node (Single Input/Output)

Most nodes have one input and one output.

```typescript
// Input handle (target)
<Handle
  id="target"
  type="target"
  position={Position.Left}
/>

// Output handle (source)
<Handle
  id="source"
  type="source"
  position={Position.Right}
/>
```

**Examples:**
- Code node: `target` → `source`
- LLM node: `target` → `source`
- HTTP node: `target` → `source`

---

### Multi-Output Node (Branch/Classifier)

Nodes that can output to different paths use dynamic handle IDs.

#### Pattern 1: Question Classifier

Each classification class gets its own handle:

```typescript
// Backend data
interface QuestionClassifierNodeData {
  classes: Array<{ id: string, name: string }>
}

// Frontend handles
<Handle id="target" type="target" position={Position.Left} />

{data.classes.map((cls) => (
  <Handle
    key={cls.id}
    id={cls.id}  // Use class ID as handle ID
    type="source"
    position={Position.Right}
  />
))}
```

**Handle IDs:**
- Input: `"target"`
- Outputs: `"class-1"`, `"class-2"`, `"class-3"`, etc.

#### Pattern 2: If-Else Node

Conditional branches with fixed handle IDs:

```typescript
<Handle id="target" type="target" position={Position.Left} />
<Handle id="true" type="source" position={Position.Right} />
<Handle id="false" type="source" position={Position.Right} />
```

**Handle IDs:**
- Input: `"target"`
- True branch: `"true"`
- False branch: `"false"`

---

### Container Nodes (Iteration/Loop)

Container nodes have multiple input/output handles for entry and exit points.

#### Iteration Node

```typescript
// Iteration node (container)
<Handle id="target" type="target" position={Position.Left} />
<Handle id="source" type="source" position={Position.Right} />

// Iteration Start node (inside container)
<Handle id="source" type="source" position={Position.Right} />

// Nodes inside iteration connect between start and parent iteration node
```

**Handle IDs:**
- Iteration: `target` (entry), `source` (exit)
- Iteration Start: `source` (first node in loop)

---

## Node Connection Types

### 1. Linear Connection (1 → 1)

Standard node-to-node connection:

```
┌────────┐        ┌────────┐
│ Node A │────────│ Node B │
│ source │  edge  │ target │
└────────┘        └────────┘
```

### 2. Fan-Out (1 → Many)

One source connects to multiple targets:

```
┌────────┐        ┌────────┐
│ Node A │───────→│ Node B │
│ source │╲       └────────┘
└────────┘ ╲
            ╲     ┌────────┐
             ────→│ Node C │
                  └────────┘
```

### 3. Fan-In (Many → 1)

Multiple sources connect to one target:

```
┌────────┐╲
│ Node A │─╲      ┌────────┐
└────────┘  ╲────→│ Node C │
             ╱    └────────┘
┌────────┐─╱
│ Node B │╱
└────────┘
```

### 4. Branch (Conditional)

Different paths based on conditions:

```
                  ┌────────┐
              ┌──→│ Node B │
┌────────┐    │   └────────┘
│ If-Else│────┤
│  true  │    │   ┌────────┐
│  false │    └──→│ Node C │
└────────┘        └────────┘
```

---

## Backend Edge Representation

### Edge Data Structure

```typescript
interface Edge {
  id: string              // Auto-generated edge ID
  source: string          // Source node ID
  sourceHandle: string    // Source handle ID
  target: string          // Target node ID
  targetHandle: string    // Target handle ID
  type?: string          // Edge type (default, custom, etc.)
  data?: any             // Additional data
}
```

### Example Edge

```typescript
{
  id: 'edge-123-456',
  source: 'node-123',
  sourceHandle: 'source',
  target: 'node-456',
  targetHandle: 'target'
}
```

### Multi-Handle Example

```typescript
// If-Else node with two output branches
{
  id: 'edge-ifelse-branch1',
  source: 'node-ifelse-1',
  sourceHandle: 'true',    // True branch
  target: 'node-success-2',
  targetHandle: 'target'
},
{
  id: 'edge-ifelse-branch2',
  source: 'node-ifelse-1',
  sourceHandle: 'false',   // False branch
  target: 'node-failure-3',
  targetHandle: 'target'
}
```

---

## Frontend Handle Implementation

### Basic Handle Component

```typescript
// In your node component (node.tsx)
import { Handle, Position } from 'reactflow'

const MyNode: FC<NodeProps<MyNodeData>> = ({ id, data }) => {
  return (
    <div className="node-container">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="!w-2 !h-2 !bg-blue-500"
      />

      {/* Node content */}
      <div>{data.title}</div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="!w-2 !h-2 !bg-green-500"
      />
    </div>
  )
}
```

### Dynamic Multiple Handles

```typescript
const ClassifierNode: FC<NodeProps<ClassifierNodeData>> = ({ id, data }) => {
  return (
    <div className="node-container">
      {/* Single input */}
      <Handle type="target" position={Position.Left} id="target" />

      {/* Node content showing classes */}
      <div>
        {data.classes.map((cls, index) => (
          <div key={cls.id} className="class-item">
            {cls.name}

            {/* Output handle for this class */}
            <Handle
              type="source"
              position={Position.Right}
              id={cls.id}
              style={{ top: `${(index + 1) * 30}px` }}  // Vertical spacing
              className="!w-2 !h-2"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Connection State Management

### Tracking Connected Handles

Node data includes arrays tracking which handles are connected:

```typescript
interface NodeData {
  _connectedSourceHandleIds?: string[]  // Which output handles have edges
  _connectedTargetHandleIds?: string[]  // Which input handles have edges
}
```

### Checking Connection Status

```typescript
const MyNode: FC<NodeProps<MyNodeData>> = ({ data }) => {
  const isConnected = data._connectedSourceHandleIds?.includes('source')

  return (
    <div>
      {/* Show indicator if connected */}
      {isConnected && <div className="connected-indicator">●</div>}

      <Handle id="source" type="source" position={Position.Right} />
    </div>
  )
}
```

### Validation Based on Connections

```typescript
// In panel.tsx - validate that required inputs are connected
const Panel: FC<NodePanelProps<MyNodeData>> = ({ id, data }) => {
  const hasInput = data._connectedTargetHandleIds?.length > 0

  if (!hasInput) {
    return (
      <div className="error-message">
        ⚠️ This node requires an input connection
      </div>
    )
  }

  return <div>{/* Normal panel UI */}</div>
}
```

---

## Advanced Patterns

### Pattern 1: Conditional Handle Visibility

Show/hide handles based on configuration:

```typescript
const MyNode: FC<NodeProps<MyNodeData>> = ({ data }) => {
  const showOptionalOutput = data.enableOptionalOutput

  return (
    <div>
      <Handle id="target" type="target" position={Position.Left} />

      {/* Always visible */}
      <Handle id="main-output" type="source" position={Position.Right} />

      {/* Conditionally visible */}
      {showOptionalOutput && (
        <Handle id="optional-output" type="source" position={Position.Right} />
      )}
    </div>
  )
}
```

### Pattern 2: Handle with Labels

Add labels next to handles for clarity:

```typescript
<div className="handle-wrapper">
  <span className="handle-label">Success</span>
  <Handle id="success" type="source" position={Position.Right} />
</div>

<div className="handle-wrapper">
  <span className="handle-label">Error</span>
  <Handle id="error" type="source" position={Position.Right} />
</div>
```

### Pattern 3: Colored Handles by Data Type

Use different colors for different data types:

```typescript
const getHandleColor = (varType: VarType) => {
  switch (varType) {
    case VarType.String:
      return '!bg-blue-500'
    case VarType.Number:
      return '!bg-green-500'
    case VarType.Object:
      return '!bg-purple-500'
    case VarType.Array:
      return '!bg-orange-500'
    default:
      return '!bg-gray-500'
  }
}

<Handle
  id="output"
  type="source"
  position={Position.Right}
  className={`!w-2 !h-2 ${getHandleColor(data.outputType)}`}
/>
```

### Pattern 4: Handle Validation (Connection Rules)

Prevent invalid connections using ReactFlow's connection validation:

```typescript
import { useCallback } from 'react'
import { Connection, useStore } from 'reactflow'

const isValidConnection = useCallback((connection: Connection) => {
  // Get source and target node data
  const nodes = useStore(s => s.nodes)
  const sourceNode = nodes.find(n => n.id === connection.source)
  const targetNode = nodes.find(n => n.id === connection.target)

  // Example: Don't allow connecting to self
  if (connection.source === connection.target) {
    return false
  }

  // Example: Check data type compatibility
  const sourceOutputType = sourceNode?.data.outputType
  const targetInputType = targetNode?.data.inputType

  if (sourceOutputType !== targetInputType) {
    return false  // Types don't match
  }

  return true
}, [])

// In ReactFlow component
<ReactFlow
  nodes={nodes}
  edges={edges}
  isValidConnection={isValidConnection}
>
```

---

## Handle Naming Best Practices

### DO ✅

- Use descriptive names: `"success"`, `"error"`, `"true"`, `"false"`
- Use IDs from data when dynamic: `item.id`, `branch.id`
- Keep simple nodes simple: `"target"`, `"source"`
- Be consistent across similar node types

### DON'T ❌

- Don't use random UUIDs: `"abc-123-def"`
- Don't use indices: `"output-0"`, `"output-1"`
- Don't use overly long names: `"primary-output-for-successful-execution"`
- Don't change handle IDs dynamically (breaks connections)

---

## Common Handle ID Reference

| Node Type | Input Handles | Output Handles |
|-----------|--------------|----------------|
| Simple (LLM, Code, HTTP) | `"target"` | `"source"` |
| If-Else | `"target"` | `"true"`, `"false"` |
| Question Classifier | `"target"` | `class.id` (dynamic) |
| Loop | `"target"` | `"source"` |
| Loop Start | (none) | `"source"` |
| Loop End | `"target"` | (none) |
| Iteration | `"target"` | `"source"` |
| Iteration Start | (none) | `"source"` |

---

## Debugging Connection Issues

### Issue 1: Edge Not Connecting

**Symptoms**: Edge disappears after drawing

**Causes:**
- Handle ID mismatch
- Handle doesn't exist on node
- Connection validation failed

**Solution:**
```typescript
// Check handle IDs match between edge and node
console.log('Edge sourceHandle:', edge.sourceHandle)
console.log('Node handles:', node.data.handles)

// Verify handle exists in DOM
const handleElement = document.querySelector(`[data-handleid="${handleId}"]`)
console.log('Handle element:', handleElement)
```

### Issue 2: Multiple Handles Overlapping

**Symptoms**: Can't click correct handle

**Solution:**
```typescript
// Add vertical spacing using index
{items.map((item, index) => (
  <Handle
    key={item.id}
    id={item.id}
    style={{
      top: `${20 + (index * 30)}px`  // 30px spacing between handles
    }}
  />
))}
```

### Issue 3: Connection State Not Updating

**Symptoms**: `_connectedSourceHandleIds` not reflecting actual connections

**Solution:**
```typescript
// This is managed by Dify's core system
// Check that edges array is properly updated
// Verify node data is syncing correctly via useNodeCrud
```

---

## See Also

- [Frontend Patterns](./frontend-patterns.md) - Complete UI patterns
- [Backend Patterns](./backend-patterns.md) - Backend data structures
- [Variable System](./variable-system.md) - How data flows through edges

---

**Last Updated**: 2024-11-14
