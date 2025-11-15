# Dify Frontend Node UI and Edge Patterns Analysis

## Overview
This document analyzes the common patterns used in the Dify frontend for building workflow nodes, managing edges, and handling variable references.

---

## 1. Edge/Handle Connection Patterns

### 1.1 Handle ID Conventions

**Location:** `/home/user/dify/web/app/components/workflow/nodes/_base/components/node-handle.tsx`

Handle IDs are typically structured by node type and purpose:

```typescript
// For question-classifier nodes with multiple topics/classes
handleId={topic.id}  // e.g., "class-1", "class-2"

// For conditional branches
handleId={branch.id}  // e.g., "true-branch", "false-branch"

// For standard input/output
handleId="default"    // Single handle per direction
```

### 1.2 Handle Definition Components

**NodeTargetHandle** - Input connection point (Left side)
```typescript
<NodeTargetHandle
  id={id}                          // Node ID
  data={data}                      // Node data
  handleId={handleId}              // Unique handle identifier
  handleClassName={handleClassName} // Custom styling
  nodeSelectorClassName={nodeSelectorClassName}
/>
```

**NodeSourceHandle** - Output connection point (Right side)
```typescript
<NodeSourceHandle
  id={id}
  data={data}
  handleId={handleId}
  handleClassName="!top-1/2 !-translate-y-1/2 !-right-[21px]"
  showExceptionStatus={true}
/>
```

**Real Example (Question Classifier):**
```typescript
// File: web/app/components/workflow/nodes/question-classifier/node.tsx
{topics.map((topic, index) => (
  <div key={index} className='relative'>
    <InfoPanel
      title={`${t(`${i18nPrefix}.class`)} ${index + 1}`}
      content={<ReadonlyInputWithSelectVar value={topic.name} nodeId={id} />}
    />
    <NodeSourceHandle
      {...props}
      handleId={topic.id}  // Each topic/class gets its own handle
      handleClassName='!top-1/2 !-translate-y-1/2 !-right-[21px]'
    />
  </div>
))}
```

### 1.3 Handle Connection State

**Location:** `/home/user/dify/web/app/components/workflow/types.ts`

Connected handles are tracked in node data:

```typescript
type CommonNodeType<T = {}> = {
  _connectedSourceHandleIds?: string[]  // Array of connected source handle IDs
  _connectedTargetHandleIds?: string[]  // Array of connected target handle IDs
  _targetBranches?: Branch[]            // For branching nodes
  // ... other properties
}

type Branch = {
  id: string
  name: string
}
```

**Usage in Node Handle Component:**
```typescript
// File: web/app/components/workflow/nodes/_base/components/node-handle.tsx
const connected = data._connectedSourceHandleIds?.includes(handleId)
const connected = data._connectedTargetHandleIds?.includes(handleId)

// Styling changes based on connection state
className={cn(
  '!h-4 !w-4',
  !connected && 'after:opacity-0',  // Hide indicator when not connected
  data._runningStatus === NodeRunningStatus.Succeeded && 'after:bg-workflow-link-line-success-handle',
)}
```

### 1.4 Edge Definition

**Location:** `/home/user/dify/web/app/components/workflow/types.ts`

```typescript
type CommonEdgeType = {
  _hovering?: boolean
  _connectedNodeIsHovering?: boolean
  _connectedNodeIsSelected?: boolean
  _isBundled?: boolean
  _sourceRunningStatus?: NodeRunningStatus
  _targetRunningStatus?: NodeRunningStatus
  _waitingRun?: boolean
  isInIteration?: boolean
  iteration_id?: string
  isInLoop?: boolean
  loop_id?: string
  sourceType: BlockEnum     // Type of source node
  targetType: BlockEnum     // Type of target node
  _isTemp?: boolean
}

type Edge = ReactFlowEdge<CommonEdgeType>
```

### 1.5 Handle Position Constants

**Location:** `reactflow` library constants

```typescript
import { Position } from 'reactflow'

// In NodeTargetHandle
position={Position.Left}

// In NodeSourceHandle
position={Position.Right}

// In CustomConnectionLine
sourcePosition: Position.Right
targetPosition: Position.Left
```

### 1.6 Custom Connection Line

**File:** `/home/user/dify/web/app/components/workflow/custom-connection-line.tsx`

```typescript
const CustomConnectionLine = ({ fromX, fromY, toX, toY }: ConnectionLineComponentProps) => {
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: Position.Right,
    targetX: toX,
    targetY: toY,
    targetPosition: Position.Left,
    curvature: 0.16,  // Bezier curve smoothing
  })

  return (
    <g>
      <path
        fill="none"
        stroke='#D0D5DD'
        strokeWidth={2}
        d={edgePath}
      />
      <rect
        x={toX}
        y={toY - 4}
        width={2}
        height={8}
        fill='#2970FF'  // Target indicator color
      />
    </g>
  )
}
```

---

## 2. Common UI Components

### 2.1 Field Component (Form Field Wrapper)

**Location:** `/home/user/dify/web/app/components/workflow/nodes/_base/components/field.tsx`

```typescript
type Props = {
  className?: string
  title: ReactNode                  // Field label
  tooltip?: ReactNode               // Help tooltip
  isSubTitle?: boolean              // Smaller text style
  supportFold?: boolean             // Collapsible field
  children?: React.JSX.Element      // Form control
  operations?: React.JSX.Element    // Action buttons (e.g., add, delete)
  inline?: boolean                  // Horizontal layout
  required?: boolean                // Red asterisk indicator
}

// Usage Example
<Field
  title={t(`${i18nPrefix}.model`)}
  required
>
  <ModelParameterModal
    popupClassName='!w-[387px]'
    isInWorkflow
    readonly={readOnly}
  />
</Field>

// With operations
<Field
  title={t(`${i18nPrefix}.inputVars`)}
  operations={
    !readOnly ? (
      <div className="flex gap-2">
        <SyncButton onClick={handleSyncFunctionSignature} />
        <AddButton onClick={handleAddVariable} />
      </div>
    ) : undefined
  }
>
  <VarList {...props} />
</Field>
```

### 2.2 Input Variable Support Component

**Location:** `/home/user/dify/web/app/components/workflow/nodes/_base/components/input-support-select-var.tsx`

```typescript
type Props = {
  className?: string
  placeholder?: string
  placeholderClassName?: string
  promptMinHeightClassName?: string
  value: string
  onChange: (value: string) => void
  onFocusChange?: (value: boolean) => void
  readOnly?: boolean
  justVar?: boolean
  nodesOutputVars?: NodeOutPutVar[]
  availableNodes?: Node[]
  insertVarTipToLeft?: boolean
}

// Used for text inputs that support variable insertion
<Editor
  value={inputValue}
  onChange={handleValueChange}
  nodesOutputVars={availableVars}
  availableNodes={availableNodesWithParent}
  readOnly={readOnly}
/>
```

### 2.3 Variable Reference Picker

**Location:** `/home/user/dify/web/app/components/workflow/nodes/_base/components/variable/var-reference-picker.tsx`

Comprehensive component for selecting variables from other nodes:

```typescript
type Props = {
  nodeId: string
  isShowNodeName?: boolean
  readonly: boolean
  value: ValueSelector | string  // [nodeId, ...path] or constant string
  onChange: (value: ValueSelector | string, varKindType: VarKindType, varInfo?: Var) => void
  isSupportConstantValue?: boolean
  filterVar?: (payload: Var, valueSelector: ValueSelector) => boolean
  isFilterFileVar?: boolean
  valueTypePlaceHolder?: string
  schema?: Partial<CredentialFormSchema>
  currentTool?: Tool
  currentProvider?: ToolWithProvider | TriggerWithProvider
  preferSchemaType?: boolean
  // ... more props
}

// Usage in LLM node
<VarReferencePicker
  readonly={readOnly}
  nodeId={id}
  isShowNodeName
  value={inputs.context?.variable_selector || []}
  onChange={handleContextVarChange}
  filterVar={filterVar}
/>
```

### 2.4 Variable Reference Structure

**ValueSelector Pattern:**
```typescript
type ValueSelector = string[] // [nodeId, key | obj key path]

// Examples:
['node-1', 'output']                    // Simple output
['node-1', 'data', 'nested', 'field']   // Nested object
['sys', 'query']                        // System variables
['env', 'API_KEY']                      // Environment variables
['rag', 'contexts']                     // RAG variable
```

### 2.5 Form Input Item Component

**Location:** `/home/user/dify/web/app/components/workflow/nodes/_base/components/form-input-item.tsx`

Handles multiple input types with variable/constant switching:

```typescript
type Props = {
  readOnly: boolean
  nodeId: string
  schema: CredentialFormSchema
  value: ResourceVarInputs
  onChange: (value: any) => void
  currentTool?: Tool
  currentProvider?: ToolWithProvider | TriggerWithProvider
  showManageInputField?: boolean
  disableVariableInsertion?: boolean
}

// Supported input types
type InputType =
  | 'textInput' | 'secretInput'  // Text inputs
  | 'textNumber'                  // Numeric input
  | 'select' | 'dynamicSelect'    // Dropdowns
  | 'checkbox'                    // Multiple checkboxes
  | 'boolean'                     // Toggle/switch
  | 'object' | 'array'            // JSON editor
  | 'file' | 'files'              // File uploads
  | 'appSelector' | 'modelSelector' // Special selectors

// Usage
<FormInputItem
  readOnly={readOnly}
  nodeId={nodeId}
  schema={schema}
  value={value}
  onChange={onChange}
  currentTool={currentTool}
  currentProvider={currentProvider}
/>
```

### 2.6 Variable List Component

**Location:** `/home/user/dify/web/app/components/workflow/nodes/_base/components/variable/var-list.tsx`

Manages dynamic lists of input variables:

```typescript
type Props = {
  nodeId: string
  readonly: boolean
  list: Variable[]
  onChange: (list: Variable[]) => void
  onVarNameChange?: (oldName: string, newName: string) => void
  isSupportConstantValue?: boolean
  filterVar?: (payload: Var, valueSelector: ValueSelector) => boolean
  isSupportFileVar?: boolean
}

type Variable = {
  variable: string                // Variable name
  label?: string | object         // Display label
  value_selector: ValueSelector   // Reference to source variable
  value_type?: VarType            // Output type
  variable_type?: VarKindType     // 'variable' or 'constant'
  value?: string                  // Constant value
  options?: string[]              // For select types
  required?: boolean
  isParagraph?: boolean
}

// Usage
<VarList
  nodeId={id}
  readonly={readOnly}
  list={inputs.variables}
  onChange={handleVarListChange}
  onVarNameChange={handleVarNameChange}
/>
```

---

## 3. Node Data Update Patterns

### 3.1 useNodeCrud Hook

**Location:** `/home/user/dify/web/app/components/workflow/nodes/_base/hooks/use-node-crud.ts`

Simple data update wrapper:

```typescript
const useNodeCrud = <T>(id: string, data: CommonNodeType<T>) => {
  const { handleNodeDataUpdateWithSyncDraft } = useNodeDataUpdate()

  const setInputs = (newInputs: CommonNodeType<T>) => {
    handleNodeDataUpdateWithSyncDraft({
      id,
      data: newInputs,
    })
  }

  return {
    inputs: data,
    setInputs,
  }
}

// Usage in a node panel
const { inputs, setInputs } = useNodeCrud(id, data)

// Update node data
setInputs({
  ...inputs,
  model: { provider: 'openai', name: 'gpt-4' }
})
```

### 3.2 useNodeDataUpdate Hook

**Location:** `/home/user/dify/web/app/components/workflow/hooks/use-node-data-update.ts`

Core data update mechanism with immer for immutable updates:

```typescript
type NodeDataUpdatePayload = {
  id: string
  data: Record<string, any>
}

export const useNodeDataUpdate = () => {
  const store = useStoreApi()
  const { handleSyncWorkflowDraft } = useNodesSyncDraft()
  const { getNodesReadOnly } = useNodesReadOnly()

  // Direct node update without sync
  const handleNodeDataUpdate = useCallback(({ id, data }: NodeDataUpdatePayload) => {
    const { getNodes, setNodes } = store.getState()
    const newNodes = produce(getNodes(), (draft) => {
      const currentNode = draft.find(node => node.id === id)!
      if (currentNode)
        currentNode.data = { ...currentNode.data, ...data }
    })
    setNodes(newNodes)
  }, [store])

  // Update with backend sync and draft persistence
  const handleNodeDataUpdateWithSyncDraft = useCallback((
    payload: NodeDataUpdatePayload,
    options?: {
      sync?: boolean
      notRefreshWhenSyncError?: boolean
      callback?: SyncCallback
    },
  ) => {
    if (getNodesReadOnly()) return
    
    handleNodeDataUpdate(payload)
    handleSyncWorkflowDraft(
      options?.sync,
      options?.notRefreshWhenSyncError,
      options?.callback
    )
  }, [handleSyncWorkflowDraft, handleNodeDataUpdate, getNodesReadOnly])

  return {
    handleNodeDataUpdate,
    handleNodeDataUpdateWithSyncDraft,
  }
}
```

### 3.3 Handle Connection Updates

**Location:** `/home/user/dify/web/app/components/workflow/hooks/use-nodes-interactions.ts`

When nodes are connected, handle IDs are tracked:

```typescript
// When creating new node after connection
newNode.data._connectedTargetHandleIds = nodeType === BlockEnum.DataSource ? [] : [targetHandle]
newNode.data._connectedSourceHandleIds = []

// When adding node between existing connections
newNode.data._connectedSourceHandleIds = [sourceHandle]
newNode.data._connectedTargetHandleIds = []

// When clearing node data
{
  _connectedSourceHandleIds: [],
  _connectedTargetHandleIds: [],
  // ... other properties
}
```

### 3.4 Variable Update Pattern

**Example from LLM Node:**

```typescript
// In use-config.ts hook
const handleContextVarChange = (
  value: ValueSelector | string,
  varKindType: VarKindType,
  varInfo?: Var
) => {
  setInputs({
    ...inputs,
    context: {
      ...inputs.context,
      variable_selector: value as ValueSelector,  // Store full selector path
    },
  })
  handleSyncWorkflowDraft()
}

const handlePromptChange = (prompt: PromptItem[]) => {
  setInputs({
    ...inputs,
    prompt_template: prompt,
  })
  handleSyncWorkflowDraft()
}

const handleCompletionParamsChange = (params: Record<string, any>) => {
  setInputs({
    ...inputs,
    model: {
      ...inputs.model,
      completion_params: params,
    },
  })
  handleSyncWorkflowDraft()
}
```

### 3.5 Variable Reference Change Pattern

**File:** `/home/user/dify/web/app/components/workflow/nodes/_base/components/variable/var-reference-picker.tsx`

```typescript
const handleVarReferenceChange = useCallback((value: ValueSelector, varInfo: Var) => {
  // Process sys var path flattening
  const newValue = produce(value, (draft) => {
    if (draft[1] && draft[1].startsWith('sys.')) {
      draft.shift()
      const paths = draft[0].split('.')
      paths.forEach((p, i) => {
        draft[i] = p
      })
    }
  })
  onChange(newValue, varKindType, varInfo)
  setOpen(false)
}, [onChange, varKindType])
```

---

## 4. Variable Reference Patterns

### 4.1 Variable Type Enumeration

**VarType** - Output variable types:
```typescript
enum VarType {
  string = 'string',
  number = 'number',
  integer = 'integer',
  secret = 'secret',
  boolean = 'boolean',
  object = 'object',
  file = 'file',
  array = 'array',
  arrayString = 'array[string]',
  arrayNumber = 'array[number]',
  arrayObject = 'array[object]',
  arrayBoolean = 'array[boolean]',
  arrayFile = 'array[file]',
  any = 'any',
  arrayAny = 'array[any]',
}
```

**VarKindType** - Input value kind:
```typescript
enum VarKindType {
  variable = 'variable',  // Reference to another node's output
  constant = 'constant',  // Literal value
  mixed = 'mixed',        // Can be either variable or constant
}
```

### 4.2 Variable Object Structure

**Location:** `/home/user/dify/web/app/components/workflow/types.ts`

```typescript
type Variable = {
  variable: string                    // Variable name (e.g., "query", "context")
  label?: string | {
    nodeType: BlockEnum
    nodeName: string
    variable: string
  }
  value_selector: ValueSelector       // Path to value [nodeId, ...path]
  value_type?: VarType                // Type of referenced value
  variable_type?: VarKindType         // 'variable' or 'constant'
  value?: string                      // Value if constant
  options?: string[]                  // Options for select types
  required?: boolean
  isParagraph?: boolean
}

type Var = {
  variable: string
  type: VarType
  children?: Var[]                    // For object/array types
  isParagraph?: boolean
  isSelect?: boolean
  options?: string[]
  required?: boolean
  des?: string
  isException?: boolean
  isLoopVariable?: boolean
  nodeId?: string
  isRagVariable?: boolean
  schemaType?: string
}
```

### 4.3 Variable Filtering Patterns

**File:** `/home/user/dify/web/app/components/workflow/nodes/_base/components/form-input-item.tsx`

```typescript
// Filter by type
const getFilterVar = () => {
  if (isNumber)
    return (varPayload: any) => varPayload.type === VarType.number
  else if (isString)
    return (varPayload: any) => [VarType.string, VarType.number, VarType.secret].includes(varPayload.type)
  else if (isFile)
    return (varPayload: any) => [VarType.file, VarType.arrayFile].includes(varPayload.type)
  else if (isBoolean)
    return (varPayload: any) => varPayload.type === VarType.boolean
  else if (isObject)
    return (varPayload: any) => varPayload.type === VarType.object
  else if (isArray)
    return (varPayload: any) => [VarType.array, VarType.arrayString, VarType.arrayNumber, VarType.arrayObject].includes(varPayload.type)
  return undefined
}

// Usage
<VarReferencePicker
  readonly={readOnly}
  nodeId={id}
  value={inputs.context?.variable_selector || []}
  onChange={handleContextVarChange}
  filterVar={filterVar}  // Pass custom filter function
/>
```

### 4.4 Variable Output Structure

```typescript
type NodeOutPutVar = {
  nodeId: string
  title: string
  vars: Var[]
  isStartNode?: boolean
  isLoop?: boolean
  isFlat?: boolean
}

// Used in nodes to expose output variables
getOutputVars?: (
  payload: T,
  allPluginInfoList: Record<string, ToolWithProvider[]>,
  ragVariables?: Var[],
  utils?: { schemaTypeDefinitions?: SchemaTypeDefinition[] }
) => Var[]
```

---

## 5. Practical Node Implementation Example

### Complete LLM Node Panel Implementation

**File:** `/home/user/dify/web/app/components/workflow/nodes/llm/panel.tsx`

```typescript
const Panel: FC<NodePanelProps<LLMNodeType>> = ({ id, data }) => {
  const { t } = useTranslation()
  const {
    readOnly,
    inputs,
    isChatModel,
    handleModelChanged,
    handleCompletionParamsChange,
    handleContextVarChange,
    filterVar,
    handlePromptChange,
    availableVars,
    availableNodesWithParent,
  } = useConfig(id, data)

  return (
    <div className='mt-2'>
      <div className='space-y-4 px-4 pb-4'>
        {/* Model Selection Field */}
        <Field title={t('workflow.nodes.llm.model')} required>
          <ModelParameterModal
            popupClassName='!w-[387px]'
            isInWorkflow
            provider={inputs.model?.provider}
            modelId={inputs.model?.name}
            setModel={handleModelChange}
            readonly={readOnly}
          />
        </Field>

        {/* Context Variable Selection */}
        <Field title={t('workflow.nodes.llm.context')}>
          <VarReferencePicker
            readonly={readOnly}
            nodeId={id}
            isShowNodeName
            value={inputs.context?.variable_selector || []}
            onChange={handleContextVarChange}
            filterVar={filterVar}
          />
        </Field>

        {/* Prompt Configuration */}
        <ConfigPrompt
          readOnly={readOnly}
          nodeId={id}
          filterVar={filterVar}
          isChatModel={isChatModel}
          payload={inputs.prompt_template}
          onChange={handlePromptChange}
        />

        {/* Input Variables */}
        <Field title={t('workflow.nodes.llm.variables')}>
          <VarList
            nodeId={id}
            readonly={readOnly}
            list={inputs.prompt_variables}
            onChange={handleVarListChange}
          />
        </Field>

        {/* Output Variables */}
        <Field title={t('workflow.nodes.llm.outputs')}>
          <OutputVars vars={outputVars} />
        </Field>
      </div>
    </div>
  )
}
```

### useConfig Hook Implementation

```typescript
const useConfig = (id: string, data: LLMNodeType) => {
  const { inputs, setInputs } = useNodeCrud(id, data)
  const { availableVars, availableNodesWithParent } = useAvailableVarList(id)

  const handleModelChanged = (model: { provider: string; modelId: string }) => {
    setInputs({
      ...inputs,
      model: { ...model, completion_params: {} },
    })
  }

  const handleContextVarChange = (value: ValueSelector) => {
    setInputs({
      ...inputs,
      context: { variable_selector: value },
    })
  }

  const handlePromptChange = (prompt: PromptItem[]) => {
    setInputs({
      ...inputs,
      prompt_template: prompt,
    })
  }

  return {
    readOnly: false,
    inputs,
    handleModelChanged,
    handleContextVarChange,
    handlePromptChange,
    availableVars,
    availableNodesWithParent,
    // ... more handlers
  }
}
```

---

## 6. Common Patterns Summary

### 6.1 Handle ID Naming Convention
- **Topic/Class Handles:** `topic.id`, `class.id` (unique per item)
- **Branch Handles:** `branch.id` (for conditional logic)
- **Default:** Single `handleId` per direction

### 6.2 Edge Connection Tracking
- Store connected handle IDs in `_connectedSourceHandleIds` and `_connectedTargetHandleIds`
- Used to hide/show connection indicators
- Enable/disable connection based on node type

### 6.3 Variable Selection Flow
1. **Trigger** → `VarReferencePicker` opens
2. **User selects** variable from available nodes
3. **ValueSelector** returned as `[nodeId, ...propertyPath]`
4. **Component updates** node data via `handleNodeDataUpdateWithSyncDraft`
5. **Backend syncs** the workflow draft

### 6.4 Form Field Components
```typescript
// Reusable pattern
<Field title={label} required operations={buttons}>
  <Component value={value} onChange={handler} />
</Field>
```

### 6.5 Node Panel Structure
```typescript
const Panel: FC<NodePanelProps<NodeType>> = ({ id, data }) => {
  const { inputs, setInputs } = useNodeCrud(id, data)
  // Hook for available variables
  const { availableVars } = useAvailableVarList(id)
  
  // Handler functions
  const handleSomething = (value) => {
    setInputs({ ...inputs, field: value })
  }
  
  return (
    <div className='mt-2'>
      <div className='space-y-4 px-4 pb-4'>
        <Field>...</Field>
        <Field>...</Field>
      </div>
    </div>
  )
}
```

---

## 7. File Reference Guide

| Purpose | File Path |
|---------|-----------|
| Hook definitions | `web/app/components/workflow/nodes/_base/hooks/use-*.ts` |
| Node handle components | `web/app/components/workflow/nodes/_base/components/node-handle.tsx` |
| Variable picker | `web/app/components/workflow/nodes/_base/components/variable/var-reference-picker.tsx` |
| Field wrapper | `web/app/components/workflow/nodes/_base/components/field.tsx` |
| Type definitions | `web/app/components/workflow/types.ts` |
| Data update logic | `web/app/components/workflow/hooks/use-node-data-update.ts` |
| Node interactions | `web/app/components/workflow/hooks/use-nodes-interactions.ts` |
| Custom edges | `web/app/components/workflow/custom-connection-line.tsx` |
| Example nodes | `web/app/components/workflow/nodes/{llm,code,question-classifier}/` |

