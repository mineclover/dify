# Panel Components Reference

Complete reference for all UI components available for custom panel development in Dify.

## Table of Contents

1. [Overview](#overview)
2. [Base Components](#base-components)
3. [Input Components](#input-components)
4. [Variable Components](#variable-components)
5. [Special Components](#special-components)
6. [Layout Components](#layout-components)
7. [Utility Components](#utility-components)
8. [Customization Patterns](#customization-patterns)

---

## Overview

### Panel Component System

All custom panels in Dify are built using reusable UI components from the `_base/components` directory:

```
web/app/components/workflow/nodes/_base/components/
├── field.tsx                    # Field wrapper (most common)
├── input.tsx                    # Text input
├── textarea.tsx                 # Multi-line text
├── select.tsx                   # Dropdown select
├── variable/                    # Variable selection components
│   ├── var-reference-picker.tsx
│   ├── var-list.tsx
│   └── input-support-select-var.tsx
├── code-editor/                 # Code editor
├── form-input-item/             # Universal input component
└── workflow-panel/              # BasePanel wrapper
```

### Import Pattern

```typescript
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Input from '@/app/components/workflow/nodes/_base/components/input'
import { VarReferencePicker } from '@/app/components/workflow/nodes/_base/components/variable'
import CodeEditor from '@/app/components/workflow/nodes/_base/components/code-editor'
```

---

## Base Components

### Field

The most commonly used layout component. Wraps inputs with label, tooltip, and validation.

**Import:**
```typescript
import Field from '@/app/components/workflow/nodes/_base/components/field'
```

**Props:**
```typescript
interface FieldProps {
  title: string | ReactNode        // Field label
  children: ReactNode              // Input component(s)

  // Optional
  tooltip?: string | ReactNode     // Tooltip text/content
  required?: boolean               // Show required indicator (*)
  operations?: ReactNode           // Actions (buttons) on the right
  supportFold?: boolean            // Collapsible section
  onFold?: () => void             // Fold callback
  isFolded?: boolean              // Fold state
  className?: string              // Custom styling
}
```

**Basic Usage:**
```typescript
<Field title="City Name" tooltip="Enter the city" required>
  <Input
    value={inputs.city}
    onChange={handleFieldChange('city')}
    placeholder="e.g., Tokyo"
  />
</Field>
```

**With Operations:**
```typescript
<Field
  title="API Keys"
  operations={
    <Button size="sm" onClick={handleAddKey}>
      + Add
    </Button>
  }
>
  {/* Input content */}
</Field>
```

**Collapsible Field:**
```typescript
const [isFolded, setIsFolded] = useState(false)

<Field
  title="Advanced Options"
  supportFold
  isFolded={isFolded}
  onFold={() => setIsFolded(!isFolded)}
>
  {!isFolded && (
    <div>
      {/* Advanced options content */}
    </div>
  )}
</Field>
```

---

### FieldTitle

Standalone field title component (used internally by Field).

**Props:**
```typescript
interface FieldTitleProps {
  title: string | ReactNode
  tooltip?: string | ReactNode
  required?: boolean
  className?: string
}
```

**Usage:**
```typescript
<FieldTitle title="Configuration" tooltip="Node settings" required />
```

---

### Box / Group

Layout helper components for organizing fields.

**Box:**
```typescript
<Box className="space-y-4">
  <Field title="Field 1">...</Field>
  <Field title="Field 2">...</Field>
</Box>
```

**Group:**
```typescript
<Group title="Authentication">
  <Field title="API Key">...</Field>
  <Field title="Secret">...</Field>
</Group>
```

---

## Input Components

### Input

Single-line text input.

**Import:**
```typescript
import Input from '@/app/components/workflow/nodes/_base/components/input'
```

**Props:**
```typescript
interface InputProps {
  value: string
  onChange: (value: string) => void

  // Optional
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  type?: 'text' | 'password' | 'email' | 'url' | 'number'
  className?: string
  onBlur?: () => void
  onFocus?: () => void
  autoFocus?: boolean
  maxLength?: number
}
```

**Examples:**

**Basic text input:**
```typescript
<Input
  value={inputs.name}
  onChange={handleFieldChange('name')}
  placeholder="Enter name"
/>
```

**Password input:**
```typescript
<Input
  type="password"
  value={inputs.apiKey}
  onChange={handleFieldChange('apiKey')}
  placeholder="sk-..."
/>
```

**Number input:**
```typescript
<Input
  type="number"
  value={inputs.timeout}
  onChange={handleFieldChange('timeout')}
  placeholder="30"
/>
```

---

### Textarea

Multi-line text input.

**Import:**
```typescript
import Textarea from '@/app/components/workflow/nodes/_base/components/textarea'
```

**Props:**
```typescript
interface TextareaProps {
  value: string
  onChange: (value: string) => void

  // Optional
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  rows?: number               // Default: 3
  autoHeight?: boolean        // Auto-expand height
  maxLength?: number
  className?: string
}
```

**Examples:**

**Basic textarea:**
```typescript
<Textarea
  value={inputs.description}
  onChange={handleFieldChange('description')}
  placeholder="Enter description"
  rows={5}
/>
```

**Auto-expanding textarea:**
```typescript
<Textarea
  value={inputs.prompt}
  onChange={handleFieldChange('prompt')}
  autoHeight
  placeholder="Enter your prompt here..."
/>
```

---

### Select

Dropdown selection component.

**Import:**
```typescript
import Select from '@/app/components/workflow/nodes/_base/components/select'
```

**Props:**
```typescript
interface SelectProps<T> {
  value: T
  onChange: (value: T) => void
  options: Array<{
    value: T
    label: string
    disabled?: boolean
  }>

  // Optional
  placeholder?: string
  disabled?: boolean
  className?: string
  renderOption?: (option: Option<T>) => ReactNode  // Custom option rendering
  renderTrigger?: (selected: Option<T>) => ReactNode  // Custom trigger
}
```

**Examples:**

**Basic select:**
```typescript
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
```

**With custom rendering:**
```typescript
<Select
  value={inputs.model}
  onChange={handleFieldChange('model')}
  options={modelOptions}
  renderOption={(option) => (
    <div className="flex items-center gap-2">
      <ModelIcon model={option.value} />
      <span>{option.label}</span>
      <Badge>{option.value}</Badge>
    </div>
  )}
/>
```

---

### Switch

Toggle switch for boolean values.

**Import:**
```typescript
import Switch from '@/app/components/workflow/nodes/_base/components/switch'
```

**Props:**
```typescript
interface SwitchProps {
  value: boolean
  onChange: (value: boolean) => void

  // Optional
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

**Usage:**
```typescript
<Field title="Enable Cache">
  <Switch
    value={inputs.enableCache}
    onChange={handleFieldChange('enableCache')}
  />
</Field>
```

---

### InputNumberWithSlider

Number input with slider control.

**Import:**
```typescript
import InputNumberWithSlider from '@/app/components/workflow/nodes/_base/components/input-number-with-slider'
```

**Props:**
```typescript
interface InputNumberWithSliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number

  // Optional
  disabled?: boolean
  className?: string
  showInput?: boolean         // Show number input (default: true)
  showSlider?: boolean        // Show slider (default: true)
}
```

**Usage:**
```typescript
<Field title="Temperature">
  <InputNumberWithSlider
    value={inputs.temperature}
    onChange={handleFieldChange('temperature')}
    min={0}
    max={2}
    step={0.1}
  />
</Field>
```

---

## Variable Components

### VarReferencePicker

Main component for selecting variables from the workflow.

**Import:**
```typescript
import { VarReferencePicker } from '@/app/components/workflow/nodes/_base/components/variable'
```

**Props:**
```typescript
interface VarReferencePickerProps {
  nodeId: string                    // Current node ID
  value: string[]                   // Selected variable path
  onChange: (value: string[]) => void

  // Required data
  availableVars: Var[]              // Available variables

  // Optional
  isShowNodeName?: boolean          // Show node name in picker
  placeholder?: string
  filterVar?: (varPayload: Var) => boolean  // Filter variables
  readonly?: boolean
  disabled?: boolean
  className?: string
}
```

**Basic Usage:**
```typescript
import { useAvailableVarList } from '../_base/hooks/use-available-var-list'

const Panel = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)
  const { availableVars } = useAvailableVarList(id)

  return (
    <Field title="Input Variable">
      <VarReferencePicker
        nodeId={id}
        isShowNodeName
        availableVars={availableVars}
        value={inputs.variable_selector}
        onChange={handleFieldChange('variable_selector')}
      />
    </Field>
  )
}
```

**With Type Filtering:**
```typescript
import { VarType } from '@/app/components/workflow/types'

const { availableVars } = useAvailableVarList(id, {
  filterVar: (varPayload) => {
    // Only string variables
    return varPayload.type === VarType.String
  }
})

<VarReferencePicker
  nodeId={id}
  availableVars={availableVars}
  value={inputs.text_input}
  onChange={handleFieldChange('text_input')}
  placeholder="Select text variable"
/>
```

**Multiple Type Filtering:**
```typescript
const { availableVars } = useAvailableVarList(id, {
  filterVar: (varPayload) => {
    // String or number variables
    return [VarType.String, VarType.Number].includes(varPayload.type)
  }
})
```

---

### VarList

Manage lists of variables with add/remove functionality.

**Import:**
```typescript
import { VarList } from '@/app/components/workflow/nodes/_base/components/variable'
```

**Props:**
```typescript
interface VarListProps {
  nodeId: string
  list: Array<{ id: string, variable: string, value_selector: string[] }>
  onChange: (list: Array<...>) => void

  // Optional
  availableVars?: Var[]
  filterVar?: (varPayload: Var) => boolean
  readonly?: boolean
  maxLength?: number          // Max items allowed
  className?: string
}
```

**Usage:**
```typescript
const [variables, setVariables] = useState([])
const { availableVars } = useAvailableVarList(id)

<Field
  title="Input Variables"
  operations={
    <Button
      size="sm"
      onClick={() => {
        setVariables([...variables, {
          id: generateId(),
          variable: '',
          value_selector: []
        }])
      }}
    >
      + Add Variable
    </Button>
  }
>
  <VarList
    nodeId={id}
    list={variables}
    onChange={setVariables}
    availableVars={availableVars}
  />
</Field>
```

---

### InputSupportSelectVar

Text input that supports inserting variables with `{{#variable#}}` syntax.

**Import:**
```typescript
import { InputSupportSelectVar } from '@/app/components/workflow/nodes/_base/components/variable'
```

**Props:**
```typescript
interface InputSupportSelectVarProps {
  nodeId: string
  value: string
  onChange: (value: string) => void

  // Optional
  availableVars?: Var[]
  filterVar?: (varPayload: Var) => boolean
  placeholder?: string
  disabled?: boolean
  multiline?: boolean         // Use textarea instead of input
  rows?: number              // For multiline mode
  className?: string
}
```

**Examples:**

**Single-line with variable insertion:**
```typescript
<InputSupportSelectVar
  nodeId={id}
  value={inputs.message}
  onChange={handleFieldChange('message')}
  availableVars={availableVars}
  placeholder="Enter message, use {{#variable#}} for dynamic content"
/>
```

**Multi-line with variable insertion:**
```typescript
<InputSupportSelectVar
  nodeId={id}
  value={inputs.prompt}
  onChange={handleFieldChange('prompt')}
  availableVars={availableVars}
  multiline
  rows={10}
  placeholder="Enter prompt with {{#variables#}}"
  filterVar={(v) => v.type === VarType.String}
/>
```

**Result example:**
```
User message: Hello {{#node-123.name#}}, your order {{#node-456.order_id#}} is ready!
```

---

### ReadonlyInputWithSelectVar

Read-only display of text with variable references.

**Import:**
```typescript
import { ReadonlyInputWithSelectVar } from '@/app/components/workflow/nodes/_base/components/variable'
```

**Props:**
```typescript
interface ReadonlyInputWithSelectVarProps {
  nodeId: string
  value: string

  // Optional
  className?: string
}
```

**Usage:**
```typescript
<Field title="Generated Prompt">
  <ReadonlyInputWithSelectVar
    nodeId={id}
    value={generatedPrompt}
  />
</Field>
```

---

## Special Components

### CodeEditor

Monaco-based code editor with syntax highlighting.

**Import:**
```typescript
import CodeEditor from '@/app/components/workflow/nodes/_base/components/code-editor'
```

**Props:**
```typescript
interface CodeEditorProps {
  value: string
  onChange: (value: string) => void

  // Optional
  language?: string           // 'python', 'javascript', 'json', etc.
  readOnly?: boolean
  height?: number | string    // Default: 200
  theme?: 'vs-dark' | 'vs-light'
  options?: monaco.editor.IEditorOptions
  className?: string
}
```

**Examples:**

**Python code editor:**
```typescript
<Field title="Python Code">
  <CodeEditor
    value={inputs.code}
    onChange={handleFieldChange('code')}
    language="python"
    height={300}
  />
</Field>
```

**JavaScript with custom options:**
```typescript
<CodeEditor
  value={inputs.script}
  onChange={handleFieldChange('script')}
  language="javascript"
  height="400px"
  options={{
    minimap: { enabled: false },
    lineNumbers: 'on',
    fontSize: 14,
    tabSize: 2
  }}
/>
```

**JSON editor:**
```typescript
<CodeEditor
  value={inputs.config}
  onChange={handleFieldChange('config')}
  language="json"
  height={200}
/>
```

---

### FormInputItem

Universal input component supporting 15+ input types.

**Import:**
```typescript
import FormInputItem from '@/app/components/workflow/nodes/_base/components/form-input-item'
```

**Props:**
```typescript
interface FormInputItemProps {
  type: InputType                 // See InputType enum below
  value: any
  onChange: (value: any) => void

  // Optional (varies by type)
  placeholder?: string
  options?: Array<{ value: any, label: string }>  // For select/radio
  min?: number                   // For number inputs
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}
```

**InputType Enum:**
```typescript
enum InputType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  SWITCH = 'switch',
  SLIDER = 'slider',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  FILE = 'file',
  COLOR = 'color',
  PASSWORD = 'password',
  EMAIL = 'email',
  URL = 'url'
}
```

**Examples:**

**Dynamic form based on config:**
```typescript
const formConfig = [
  { type: 'text', key: 'name', label: 'Name' },
  { type: 'number', key: 'age', label: 'Age', min: 0, max: 120 },
  { type: 'select', key: 'country', label: 'Country', options: countries },
  { type: 'switch', key: 'active', label: 'Active' }
]

{formConfig.map(field => (
  <Field key={field.key} title={field.label}>
    <FormInputItem
      type={field.type}
      value={inputs[field.key]}
      onChange={handleFieldChange(field.key)}
      {...field}
    />
  </Field>
))}
```

---

### Selector

Advanced selector with search and custom rendering.

**Import:**
```typescript
import Selector from '@/app/components/workflow/nodes/_base/components/selector'
```

**Props:**
```typescript
interface SelectorProps<T> {
  value: T | T[]
  onChange: (value: T | T[]) => void
  options: Array<{
    value: T
    label: string
    icon?: ReactNode
    description?: string
  }>

  // Optional
  multiple?: boolean          // Multi-select mode
  searchable?: boolean        // Enable search
  placeholder?: string
  disabled?: boolean
  renderOption?: (option: Option<T>) => ReactNode
  className?: string
}
```

**Usage:**
```typescript
<Selector
  value={inputs.models}
  onChange={handleFieldChange('models')}
  options={modelOptions}
  multiple
  searchable
  placeholder="Select models"
  renderOption={(option) => (
    <div className="flex items-center gap-2">
      {option.icon}
      <div>
        <div className="font-medium">{option.label}</div>
        <div className="text-xs text-gray-500">{option.description}</div>
      </div>
    </div>
  )}
/>
```

---

## Layout Components

### Split

Create resizable split panels.

**Import:**
```typescript
import Split from '@/app/components/workflow/nodes/_base/components/split'
```

**Props:**
```typescript
interface SplitProps {
  direction?: 'horizontal' | 'vertical'
  defaultSize?: number        // Default split position (0-1)
  minSize?: number           // Minimum pane size in pixels
  children: [ReactNode, ReactNode]
  className?: string
}
```

**Usage:**
```typescript
<Split direction="horizontal" defaultSize={0.5} minSize={200}>
  <div>Left panel content</div>
  <div>Right panel content</div>
</Split>
```

---

### Collapse

Collapsible sections.

**Import:**
```typescript
import Collapse from '@/app/components/workflow/nodes/_base/components/collapse'
```

**Props:**
```typescript
interface CollapseProps {
  title: string | ReactNode
  children: ReactNode

  // Optional
  defaultOpen?: boolean
  open?: boolean             // Controlled mode
  onOpenChange?: (open: boolean) => void
  headerRight?: ReactNode    // Actions in header
  className?: string
}
```

**Examples:**

**Uncontrolled:**
```typescript
<Collapse title="Advanced Settings" defaultOpen={false}>
  <div className="space-y-4">
    <Field title="Option 1">...</Field>
    <Field title="Option 2">...</Field>
  </div>
</Collapse>
```

**Controlled with header actions:**
```typescript
const [isOpen, setIsOpen] = useState(false)

<Collapse
  title="API Configuration"
  open={isOpen}
  onOpenChange={setIsOpen}
  headerRight={
    <Button size="sm" onClick={handleReset}>
      Reset
    </Button>
  }
>
  {/* Content */}
</Collapse>
```

---

## Utility Components

### OptionCard

Selectable card component for choosing between options.

**Import:**
```typescript
import OptionCard from '@/app/components/workflow/nodes/_base/components/option-card'
```

**Props:**
```typescript
interface OptionCardProps {
  title: string
  description?: string
  icon?: ReactNode
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  className?: string
}
```

**Usage:**
```typescript
<div className="grid grid-cols-2 gap-4">
  <OptionCard
    title="Simple Mode"
    description="Quick setup with defaults"
    icon={<SimpleIcon />}
    selected={inputs.mode === 'simple'}
    onClick={() => handleFieldChange('mode')('simple')}
  />
  <OptionCard
    title="Advanced Mode"
    description="Full customization"
    icon={<AdvancedIcon />}
    selected={inputs.mode === 'advanced'}
    onClick={() => handleFieldChange('mode')('advanced')}
  />
</div>
```

---

### FormInputBoolean

Boolean input with multiple display modes.

**Import:**
```typescript
import FormInputBoolean from '@/app/components/workflow/nodes/_base/components/form-input-boolean'
```

**Props:**
```typescript
interface FormInputBooleanProps {
  value: boolean
  onChange: (value: boolean) => void

  // Optional
  mode?: 'switch' | 'checkbox' | 'radio'
  label?: string
  disabled?: boolean
  className?: string
}
```

**Usage:**
```typescript
<FormInputBoolean
  mode="switch"
  value={inputs.enabled}
  onChange={handleFieldChange('enabled')}
  label="Enable feature"
/>
```

---

## Customization Patterns

### Pattern 1: Custom Styling

All components support `className` prop:

```typescript
<Input
  value={inputs.value}
  onChange={handleFieldChange('value')}
  className="border-2 border-blue-500 rounded-lg"
/>

<Field
  title="Custom Field"
  className="bg-gray-50 p-4 rounded"
>
  <Input ... />
</Field>
```

### Pattern 2: Conditional Rendering

Show/hide components based on state:

```typescript
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

{inputs.mode === 'advanced' && (
  <Field title="Advanced Options">
    <InputNumberWithSlider ... />
  </Field>
)}
```

### Pattern 3: Dynamic Lists

Add/remove items dynamically:

```typescript
const [items, setItems] = useState<string[]>([])

<Field
  title="Items"
  operations={
    <Button onClick={() => setItems([...items, ''])}>
      + Add
    </Button>
  }
>
  <div className="space-y-2">
    {items.map((item, index) => (
      <div key={index} className="flex gap-2">
        <Input
          value={item}
          onChange={(value) => {
            const newItems = [...items]
            newItems[index] = value
            setItems(newItems)
          }}
        />
        <Button
          onClick={() => setItems(items.filter((_, i) => i !== index))}
        >
          Remove
        </Button>
      </div>
    ))}
  </div>
</Field>
```

### Pattern 4: Validation Display

Show validation errors:

```typescript
const [error, setError] = useState<string>()

const handleChange = (value: string) => {
  if (!value.trim()) {
    setError('This field is required')
  } else {
    setError(undefined)
  }
  handleFieldChange('field')(value)
}

<Field title="Required Field" required>
  <Input
    value={inputs.field}
    onChange={handleChange}
    className={error ? 'border-red-500' : ''}
  />
  {error && (
    <div className="text-xs text-red-500 mt-1">{error}</div>
  )}
</Field>
```

### Pattern 5: Custom Rendered Options

Custom option rendering in Select/Selector:

```typescript
<Select
  value={inputs.option}
  onChange={handleFieldChange('option')}
  options={options}
  renderOption={(option) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <option.icon className="w-4 h-4" />
        <span>{option.label}</span>
      </div>
      {option.badge && (
        <Badge variant="success">{option.badge}</Badge>
      )}
    </div>
  )}
  renderTrigger={(selected) => (
    <div className="flex items-center gap-2">
      <selected.icon className="w-4 h-4" />
      <span>{selected.label}</span>
    </div>
  )}
/>
```

### Pattern 6: Composite Components

Combine multiple components:

```typescript
<Field title="API Configuration">
  <div className="space-y-3">
    <Select
      value={inputs.method}
      onChange={handleFieldChange('method')}
      options={httpMethods}
    />

    <InputSupportSelectVar
      nodeId={id}
      value={inputs.url}
      onChange={handleFieldChange('url')}
      availableVars={availableVars}
      placeholder="https://api.example.com/{{#endpoint#}}"
    />

    <Collapse title="Headers" defaultOpen={false}>
      <VarList
        nodeId={id}
        list={inputs.headers}
        onChange={handleFieldChange('headers')}
      />
    </Collapse>
  </div>
</Field>
```

---

## Component Selection Guide

| Use Case | Recommended Component |
|----------|----------------------|
| Single-line text | `Input` |
| Multi-line text | `Textarea` |
| Choose from options | `Select` |
| True/false toggle | `Switch` |
| Variable selection | `VarReferencePicker` |
| Text with variables | `InputSupportSelectVar` |
| Multiple variables | `VarList` |
| Code editing | `CodeEditor` |
| Number with slider | `InputNumberWithSlider` |
| Collapsible section | `Collapse` |
| Option cards | `OptionCard` |
| Dynamic form | `FormInputItem` |
| Custom layout | `Field` + children |

---

## Common Patterns Summary

### ✅ DO

```typescript
// Use Field wrapper for labels
<Field title="Name">
  <Input ... />
</Field>

// Use useConfig hook for state management
const { inputs, handleFieldChange } = useConfig(id, data)

// Filter variables by type
const { availableVars } = useAvailableVarList(id, {
  filterVar: (v) => v.type === VarType.String
})

// Memoize components
const Panel = memo(({ id, data }) => { ... })
```

### ❌ DON'T

```typescript
// Don't use hardcoded text (use i18n)
<Field title="Name">  // ❌

// Don't forget Field wrapper
<Input ... />  // ❌ (no label)

// Don't use local state for node data
const [value, setValue] = useState('')  // ❌ (won't persist)

// Don't render all variables without filtering
<VarReferencePicker availableVars={allVars} />  // ❌ (overwhelming)
```

---

## See Also

- [Custom Panel Guide](./custom-panel-guide.md) - Step-by-step panel development
- [Frontend Patterns](./frontend-patterns.md) - Complete UI architecture
- [Variable System](./variable-system.md) - Variable selection deep dive
- [Common Mistakes](./common-mistakes.md) - Avoid pitfalls

---

**Last Updated**: 2024-11-15
**Version**: 1.0.0
