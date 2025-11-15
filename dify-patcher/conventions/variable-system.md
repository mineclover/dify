# Variable System Deep Dive

Complete guide to the variable pool and variable selector system in Dify.

## Table of Contents

1. [Overview](#overview)
2. [Variable Pool Architecture](#variable-pool-architecture)
3. [Variable Types](#variable-types)
4. [Variable Selectors](#variable-selectors)
5. [Backend Variable Access](#backend-variable-access)
6. [Frontend Variable Selection](#frontend-variable-selection)
7. [Variable Transformation](#variable-transformation)
8. [Advanced Patterns](#advanced-patterns)

---

## Overview

The variable system in Dify allows data to flow between nodes in a workflow. Each node can output variables that subsequent nodes can reference.

### Key Concepts

- **Variable Pool**: Central storage for all variables in a workflow execution
- **Variable Selector**: Path-based reference to a specific variable
- **Value Selector**: Array notation for accessing nested properties
- **Variable Segments**: Different variable categories (system, user, environment, node outputs)

---

## Variable Pool Architecture

### Structure

```python
class VariablePool:
    """
    Hierarchical variable storage

    Structure: {
        'sys': {...},           # System variables
        'env': {...},           # Environment variables
        'node-123': {           # Node outputs
            'output1': value1,
            'output2': value2
        },
        'node-456': {...}
    }
    """
    system_variables: dict
    user_inputs: dict
    environment_variables: list[dict]
    conversation_variables: list[dict]
```

### Variable Categories

#### 1. System Variables (`sys.`)

Built-in variables available to all nodes:

```python
{
    'query': str,              # User query/input
    'files': list[File],       # Uploaded files
    'conversation_id': str,    # Current conversation ID
    'user_id': str,           # Current user ID
    'app_id': str,            # Application ID
}
```

#### 2. Node Output Variables (`node-id.`)

Variables produced by nodes:

```python
# Example: LLM node with ID 'llm-1' outputs:
{
    'llm-1': {
        'text': "Generated text...",
        'usage': {
            'tokens': 150,
            'cost': 0.003
        }
    }
}
```

#### 3. Environment Variables (`env.`)

User-defined environment variables:

```python
{
    'env': {
        'API_KEY': 'sk-...',
        'BASE_URL': 'https://api.example.com'
    }
}
```

---

## Variable Types

### VarType Enum

```python
from enum import StrEnum

class VarType(StrEnum):
    STRING = 'string'
    NUMBER = 'number'
    INTEGER = 'integer'
    SECRET = 'secret'
    BOOLEAN = 'boolean'
    OBJECT = 'object'
    FILE = 'file'
    ARRAY = 'array'
    ARRAY_STRING = 'array[string]'
    ARRAY_NUMBER = 'array[number]'
    ARRAY_OBJECT = 'array[object]'
    ARRAY_FILE = 'array[file]'
```

### Special Types

#### FileSegment

```python
class FileSegment:
    """Represents a file variable"""
    id: str
    name: str
    mime_type: str
    url: str
    size: int
```

#### ObjectSegment

```python
class ObjectSegment:
    """Represents a structured object variable"""
    value: dict
```

---

## Variable Selectors

### Format

Variable selectors use array notation:

```python
value_selector = ['segment1', 'segment2', 'segment3', ...]
```

### Examples

**System query:**
```python
['sys', 'query']
```

**Node output:**
```python
['node-123', 'text']
```

**Nested object access:**
```python
['node-456', 'result', 'data', 'items', '0', 'name']
# Accesses: node_outputs['node-456']['result']['data']['items'][0]['name']
```

**Array indexing:**
```python
['node-789', 'items', '2']  # Third item
['node-789', 'items', '*']  # All items (special notation)
```

### VariableSelector Model

```python
from pydantic import BaseModel
from typing import Sequence

class VariableSelector(BaseModel):
    """
    Variable selector for node inputs
    """
    variable: str                    # Display name (for UI)
    value_selector: Sequence[str]    # Actual path to variable
```

### Usage in Node Data

**Single variable:**
```python
class MyNodeData(BaseNodeData):
    input_var: VariableSelector
```

**Multiple variables:**
```python
class MyNodeData(BaseNodeData):
    variables: list[VariableSelector]
```

---

## Backend Variable Access

### In Custom Nodes

#### Method 1: Using SDK Helper

```python
from dify_custom_nodes import BaseCustomNode

class MyNode(BaseCustomNode):
    def _run(self):
        # Get variable using selector
        value = self.get_variable('node-123.output.text')

        # Or using array notation
        value = self.get_variable(['node-123', 'output', 'text'])
```

#### Method 2: Direct Variable Pool Access

```python
from core.workflow.entities.variable_pool import VariableSelector

class MyNode(BaseCustomNode):
    def _run(self):
        # Get variable selector from config
        var_selector = self._node_data.input_var  # VariableSelector

        # Retrieve from variable pool
        variable = self.graph_runtime_state.variable_pool.get(
            var_selector.value_selector
        )

        # Convert to usable value
        value = variable.to_object() if variable else None
```

### Variable Pool Methods

```python
class VariablePool:
    def get(self, selector: Sequence[str]) -> Variable:
        """Get variable by selector path"""

    def add(self, path: Sequence[str], value: Any) -> None:
        """Add/update variable"""

    def remove(self, path: Sequence[str]) -> None:
        """Remove variable"""

    def get_any(self, selector: Sequence[str]) -> Any:
        """Get variable and convert to Python object"""
```

### Adding Output Variables

```python
class MyNode(BaseCustomNode):
    def _run(self):
        # Process data
        result = process_data()

        # Return outputs (automatically added to variable pool)
        return {
            'status': WorkflowNodeExecutionStatus.SUCCEEDED,
            'outputs': {
                'result': result,
                'metadata': {
                    'processing_time': 1.5,
                    'items_count': 10
                }
            }
        }

        # These become available as:
        # [self.id, 'result']
        # [self.id, 'metadata', 'processing_time']
        # [self.id, 'metadata', 'items_count']
```

---

## Frontend Variable Selection

### VarReferencePicker Component

Main component for selecting variables:

```typescript
import { VarReferencePicker } from '@/app/components/workflow/nodes/_base/components/variable'

<VarReferencePicker
  nodeId={id}
  isShowNodeName               // Show node name in picker
  availableVars={availableVars}
  value={inputs.variable_selector}
  onChange={handleFieldChange('variable_selector')}
/>
```

### useAvailableVarList Hook

Get available variables for current node:

```typescript
import { useAvailableVarList } from '../_base/hooks/use-available-var-list'

const Panel = ({ id, data }) => {
  const { availableVars, availableNodesWithParent } = useAvailableVarList(id, {
    onlyLeafNodeVar: false,      // Include parent nodes
    filterVar: (varPayload) => {
      // Filter variables by type
      return varPayload.type === VarType.String
    }
  })

  return (
    <VarReferencePicker
      nodeId={id}
      availableVars={availableVars}
      // ...
    />
  )
}
```

### Variable Filtering

Filter variables by type or other criteria:

```typescript
// Filter for string variables only
const stringVarsOnly = useAvailableVarList(id, {
  filterVar: (varPayload) => varPayload.type === VarType.String
})

// Filter for files only
const fileVarsOnly = useAvailableVarList(id, {
  filterVar: (varPayload) => varPayload.type === VarType.File
})

// Filter for arrays
const arrayVarsOnly = useAvailableVarList(id, {
  filterVar: (varPayload) => varPayload.type.startsWith('array')
})

// Complex filtering
const customFilter = useAvailableVarList(id, {
  filterVar: (varPayload) => {
    // Only from specific node types
    if (varPayload.nodeType !== 'llm') return false

    // Only specific variable names
    if (!['text', 'result'].includes(varPayload.variable)) return false

    return true
  }
})
```

---

## Variable Transformation

### Type Conversion

The variable system automatically converts between types:

```python
# String → Number
"123" → 123

# Number → String
456 → "456"

# Object → String (JSON)
{'key': 'value'} → '{"key": "value"}'

# Array → String (join)
['a', 'b', 'c'] → 'a, b, c'
```

### FileSegment Handling

```python
from core.workflow.entities.variable_pool import FileSegment

def _run(self):
    # Get file variable
    file_selector = self._node_data.file_input
    file_var = self.graph_runtime_state.variable_pool.get(file_selector.value_selector)

    if isinstance(file_var, FileSegment):
        # Access file properties
        file_name = file_var.name
        file_url = file_var.url
        file_size = file_var.size
        mime_type = file_var.mime_type
```

### ObjectSegment Handling

```python
from core.workflow.entities.variable_pool import ObjectSegment

def _run(self):
    # Get object variable
    obj_var = self.graph_runtime_state.variable_pool.get(['node-123', 'result'])

    if isinstance(obj_var, ObjectSegment):
        # Access as dict
        data = obj_var.value
        # data is now a Python dictionary
```

---

## Advanced Patterns

### Pattern 1: Dynamic Variable Lists

Allow users to add multiple variable inputs:

```python
class MyNodeData(BaseNodeData):
    variables: list[VariableSelector] = Field(default_factory=list)
```

```typescript
<VarList
  list={inputs.variables}
  onChange={handleFieldChange('variables')}
  renderItem={(item, index) => (
    <VarReferencePicker
      value={item.value_selector}
      onChange={(value) => {
        const newVars = [...inputs.variables]
        newVars[index] = { ...item, value_selector: value }
        handleFieldChange('variables')(newVars)
      }}
    />
  )}
/>
```

### Pattern 2: Conditional Variable Requirements

Require specific variables based on configuration:

```python
class MyNodeData(BaseNodeData):
    mode: Literal['simple', 'advanced']
    simple_input: VariableSelector | None = None
    advanced_inputs: list[VariableSelector] | None = None

    @model_validator(mode='after')
    def validate_inputs(self):
        if self.mode == 'simple' and not self.simple_input:
            raise ValueError("Simple mode requires simple_input")
        if self.mode == 'advanced' and not self.advanced_inputs:
            raise ValueError("Advanced mode requires advanced_inputs")
        return self
```

### Pattern 3: Variable with Default Fallback

Provide fallback if variable is not available:

```python
def _run(self):
    # Try to get variable
    var_selector = self._node_data.optional_input

    if var_selector:
        value = self.get_variable(var_selector.value_selector)
    else:
        value = self._node_data.default_value  # Use default

    # Process with value
    result = process(value)
```

### Pattern 4: Validating Variable Types at Runtime

```python
def _run(self):
    var = self.graph_runtime_state.variable_pool.get(
        self._node_data.input_var.value_selector
    )

    # Check type
    if var.value_type != VarType.STRING:
        return {
            'status': WorkflowNodeExecutionStatus.FAILED,
            'error': f"Expected string, got {var.value_type}"
        }

    # Safe to use as string
    text = var.to_object()
```

---

## Variable Reference Patterns

### Pattern: Context Variables

LLM nodes often use context variables (from knowledge retrieval):

```python
class LLMNodeData(BaseNodeData):
    context: ContextConfig

class ContextConfig(BaseModel):
    enabled: bool
    variable_selector: VariableSelector  # Points to knowledge retrieval output
```

### Pattern: Memory Variables

Nodes that use conversation history:

```python
class MemoryConfig(BaseModel):
    window: int                           # Number of messages to remember
    query_prompt_template: str
    role_prefix: dict[str, str]
```

### Pattern: Iteration Variables

Inside iteration/loop nodes:

```python
# Special variables available in iteration
['iteration', 'index']      # Current iteration index (0-based)
['iteration', 'item']        # Current item being processed
['iteration', 'items']       # All items in iteration
```

---

## Debugging Variables

### Check Variable Pool Contents

```python
def _run(self):
    # Print all available variables (debugging)
    import json
    pool_contents = self.graph_runtime_state.variable_pool.to_dict()
    print(json.dumps(pool_contents, indent=2))

    # Continue execution...
```

### Validate Variable Exists

```python
def _run(self):
    selector = self._node_data.input_var.value_selector

    try:
        var = self.graph_runtime_state.variable_pool.get(selector)
        if var is None:
            raise ValueError(f"Variable not found: {selector}")
    except Exception as e:
        return {
            'status': WorkflowNodeExecutionStatus.FAILED,
            'error': f"Variable error: {str(e)}"
        }
```

---

## Common Mistakes

### ❌ Mistake 1: Hardcoded Node IDs

```python
# Don't do this
value = self.get_variable(['node-123', 'output'])  # Breaks if node ID changes
```

```python
# Do this
var_selector = self._node_data.input_var  # Let user select via UI
value = self.get_variable(var_selector.value_selector)
```

### ❌ Mistake 2: Assuming Variable Exists

```python
# Don't do this
value = self.get_variable(['upstream-node', 'output'])  # May be None
result = value.upper()  # Crash if value is None
```

```python
# Do this
value = self.get_variable(['upstream-node', 'output'])
if value is None:
    return {'status': 'failed', 'error': 'Missing input'}
result = value.upper()
```

### ❌ Mistake 3: Wrong Type Assumptions

```python
# Don't do this
value = self.get_variable(['node', 'count'])
result = value + 10  # Crash if value is a string "5"
```

```python
# Do this
value = self.get_variable(['node', 'count'])
if not isinstance(value, (int, float)):
    value = float(value)  # Convert
result = value + 10
```

---

## See Also

- [Backend Patterns](./backend-patterns.md) - Node data structures
- [Frontend Patterns](./frontend-patterns.md) - UI components
- [Input Types](./input-types.md) - All input type reference

---

**Last Updated**: 2024-11-14
