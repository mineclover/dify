# Dify Codebase Conventions

This directory contains comprehensive documentation of Dify's coding patterns, conventions, and best practices extracted from the codebase analysis.

## 📚 Documentation Structure

### Backend Conventions
- **[backend-patterns.md](./backend-patterns.md)** - Complete backend patterns (26KB)
  - Node data structure patterns
  - Pydantic validation patterns
  - Variable selector usage
  - 100+ code examples with file paths

- **[backend-quick-reference.md](./backend-quick-reference.md)** - Quick lookup (8KB)
  - Common components matrix
  - File location index
  - Pattern cheat sheet

- **[backend-implementation-guide.md](./backend-implementation-guide.md)** - Step-by-step guide (14KB)
  - Template for new nodes
  - Complete example implementation
  - Testing patterns

- **[backend-analysis-summary.md](./backend-analysis-summary.md)** - Analysis overview (10KB)
  - Key findings
  - Statistics
  - Best practices checklist

### Frontend Conventions
- **[frontend-patterns.md](./frontend-patterns.md)** - Complete frontend patterns (23KB)
  - Edge/Handle connection patterns
  - UI component usage
  - Variable reference system
  - Node data update mechanisms
  - 20+ code examples

### Panel Development (NEW)
- **[panel-components.md](./panel-components.md)** - Complete panel UI components reference (22KB)
  - All available UI components (Input, Select, CodeEditor, etc.)
  - Component API reference with examples
  - Variable components (VarReferencePicker, VarList)
  - Layout components (Field, Collapse, Split)
  - Customization patterns
  - 30+ component examples

- **[custom-panel-guide.md](./custom-panel-guide.md)** - Step-by-step panel development guide (24KB)
  - Quick start examples
  - Complete tutorial series
  - Advanced patterns (conditional rendering, validation, dynamic lists)
  - Real-world examples (HTTP request, LLM configuration)
  - Testing and debugging guide
  - Best practices and checklist

### Additional Resources
- **[input-types.md](./input-types.md)** - Comprehensive input type reference
- **[edge-patterns.md](./edge-patterns.md)** - Edge connection deep dive
- **[variable-system.md](./variable-system.md)** - Variable pool and selector patterns
- **[common-mistakes.md](./common-mistakes.md)** - Common pitfalls and solutions

## 🚀 Quick Start

### For Backend Development

1. **Start Here**: Read [backend-quick-reference.md](./backend-quick-reference.md)
2. **Implement**: Follow [backend-implementation-guide.md](./backend-implementation-guide.md)
3. **Reference**: Use [backend-patterns.md](./backend-patterns.md) for specific patterns

**Example: Create a new node**
```python
from dify_custom_nodes import BaseCustomNode, register_node
from pydantic import BaseModel, Field, field_validator

@register_node('my-node', version='1')
class MyNode(BaseCustomNode):
    # Follow patterns from backend-implementation-guide.md
    ...
```

### For Frontend Development

1. **Start Here**: Read [frontend-patterns.md](./frontend-patterns.md)
2. **Reference**: Check handle ID conventions and component usage
3. **Implement**: Use boilerplate patterns

**Example: Create node panel**
```typescript
// Follow patterns from frontend-patterns.md
const Panel: FC<NodePanelProps<MyNodeData>> = ({ id, data }) => {
  const { inputs, setInputs } = useNodeCrud(id, data)
  // ... implementation
}
```

### For Panel UI Development

1. **Start Here**: Read [custom-panel-guide.md](./custom-panel-guide.md) for step-by-step tutorials
2. **Reference**: Use [panel-components.md](./panel-components.md) for component API
3. **Example**: Study [advanced-panel-example](../nodes/advanced-panel-example/) node

**Example: Create panel with components**
```typescript
import { useConfig } from './use-config'
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Input from '@/app/components/workflow/nodes/_base/components/input'
import { VarReferencePicker } from '@/app/components/workflow/nodes/_base/components/variable'

const Panel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)
  const { availableVars } = useAvailableVarList(id)

  return (
    <div className="space-y-4">
      <Field title="Name" required>
        <Input value={inputs.name} onChange={handleFieldChange('name')} />
      </Field>
      <Field title="Input Variable">
        <VarReferencePicker
          nodeId={id}
          availableVars={availableVars}
          value={inputs.variable}
          onChange={handleFieldChange('variable')}
        />
      </Field>
    </div>
  )
}
```

## 📖 Key Patterns Reference

### Backend: Node Data Definition

```python
# Pattern: Composition over Inheritance
class MyNodeData(BaseNodeData):
    # Common reusable components
    model: ModelConfig                    # LLM configuration
    prompt_template: PromptTemplate       # Prompt configuration
    variables: list[VariableSelector]     # Input variables

    # Custom fields
    custom_field: str = Field(default="")

    # Validation
    @field_validator('custom_field', mode='before')
    @classmethod
    def validate_custom(cls, v):
        return v.strip()
```

### Frontend: Variable Selector

```typescript
// Pattern: Variable selector usage
<VarReferencePicker
  nodeId={id}
  isShowNodeName
  availableVars={availableVars}
  value={inputs.variable_selector}
  onChange={(value) => handleChange('variable_selector', value)}
/>

// Variable format: [nodeId, ...propertyPath]
// Example: ['node-123', 'outputs', 'result']
```

### Edge/Handle Patterns

```typescript
// Pattern: Handle ID conventions
// Simple node: one input, one output
<Handle type="target" position={Position.Left} id="target" />
<Handle type="source" position={Position.Right} id="source" />

// Multi-output node (e.g., classifier)
{items.map(item => (
  <Handle
    key={item.id}
    type="source"
    position={Position.Right}
    id={item.id}  // Use item ID as handle ID
  />
))}
```

## 🔍 Finding Specific Information

| Need | Document |
|------|----------|
| "How do I define input variables?" | [backend-patterns.md#variable-selector](./backend-patterns.md) |
| "How do I add a select dropdown?" | [input-types.md#select](./input-types.md) |
| "How do handles work?" | [frontend-patterns.md#handles](./frontend-patterns.md) |
| "How do I validate inputs?" | [backend-patterns.md#validation](./backend-patterns.md) |
| "What components are available?" | [frontend-patterns.md#components](./frontend-patterns.md) |
| "How do I reference variables?" | [variable-system.md](./variable-system.md) |
| **"How do I create a panel UI?"** | **[custom-panel-guide.md](./custom-panel-guide.md)** |
| **"What UI components can I use?"** | **[panel-components.md](./panel-components.md)** |
| **"How do I add variable selection?"** | **[panel-components.md#variable-components](./panel-components.md)** |
| **"How do I add dynamic lists?"** | **[custom-panel-guide.md#tutorial-6](./custom-panel-guide.md)** |
| **"How do I add validation?"** | **[custom-panel-guide.md#pattern-3](./custom-panel-guide.md)** |

## 📊 Statistics

- **Analyzed Files**: 60+ files (backend + frontend)
- **Patterns Documented**: 40+ distinct patterns
- **Code Examples**: 150+ with file paths
- **Node Types Examined**: 26+ node types
- **UI Components Documented**: 30+ panel components
- **Documentation Size**: 200KB+ total

## 🎯 Best Practices Checklist

### Backend
- ✅ Use Pydantic BaseModel for all data classes
- ✅ Inherit from BaseNodeData
- ✅ Use field_validator for single-field validation
- ✅ Use model_validator for cross-field validation
- ✅ Provide default values
- ✅ Use VariableSelector for node output references
- ✅ Implement proper error handling

### Frontend
- ✅ Use useNodeCrud hook for state management
- ✅ Use VarReferencePicker for variable selection
- ✅ Follow handle ID conventions
- ✅ Implement proper TypeScript types
- ✅ Use Field component for consistent layout
- ✅ Sync data with handleNodeDataUpdateWithSyncDraft

### Panel Development
- ✅ Use useConfig hook for state management
- ✅ Wrap all inputs in Field components
- ✅ Memoize panel components with React.memo
- ✅ Use i18n for all user-facing text
- ✅ Filter variables by type before showing picker
- ✅ Provide tooltips for complex fields
- ✅ Mark required fields with required prop
- ✅ Validate inputs and show error messages
- ✅ Use appropriate components for each data type
- ✅ Test panel in both light and dark mode

## 🆕 Contributing New Patterns

When you discover new patterns:

1. Document in the appropriate file
2. Provide code examples with file paths
3. Explain the use case
4. Add to this index

## 📞 Support

If patterns are unclear or missing:
- Create an issue in the dify-patcher repository
- Reference the specific pattern name
- Provide your use case

---

**Last Updated**: 2024-11-14
**Coverage**: Dify codebase analysis up to commit `4a89403`
