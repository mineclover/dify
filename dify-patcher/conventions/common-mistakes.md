# Common Mistakes and Solutions

A collection of common pitfalls when developing custom Dify nodes and how to avoid them.

## Table of Contents

1. [Backend Mistakes](#backend-mistakes)
2. [Frontend Mistakes](#frontend-mistakes)
3. [Variable System Mistakes](#variable-system-mistakes)
4. [Edge/Handle Mistakes](#edgehandle-mistakes)
5. [Performance Mistakes](#performance-mistakes)

---

## Backend Mistakes

### ❌ Mistake 1: Not Inheriting from BaseNodeData

**Wrong:**
```python
from pydantic import BaseModel

class MyNodeData(BaseModel):  # Missing BaseNodeData
    my_field: str
```

**Why it's wrong:**
- Missing required fields (title, desc, version, etc.)
- No retry/error handling configuration
- Won't work with Dify's node system

**Correct:**
```python
from core.workflow.nodes.base.entities import BaseNodeData

class MyNodeData(BaseNodeData):
    my_field: str
```

---

### ❌ Mistake 2: Missing field_validator for User Input

**Wrong:**
```python
class MyNodeData(BaseNodeData):
    url: str  # No validation
```

**Why it's wrong:**
- User might enter whitespace-only strings
- No trimming of input
- Invalid URLs crash at runtime

**Correct:**
```python
from pydantic import field_validator, HttpUrl

class MyNodeData(BaseNodeData):
    url: str

    @field_validator('url', mode='before')
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("URL is required")
        v = v.strip()
        if not v.startswith(('http://', 'https://')):
            raise ValueError("URL must start with http:// or https://")
        return v
```

---

### ❌ Mistake 3: Not Handling None in _run()

**Wrong:**
```python
def _run(self):
    text = self.get_input('text')
    result = text.upper()  # Crashes if text is None
```

**Why it's wrong:**
- get_input() can return None
- Crashes workflow execution

**Correct:**
```python
def _run(self):
    text = self.get_input('text', '')  # Provide default
    if not text:
        return {
            'status': WorkflowNodeExecutionStatus.FAILED,
            'error': 'Text input is required'
        }
    result = text.upper()
```

---

### ❌ Mistake 4: Mutable Default Arguments

**Wrong:**
```python
class MyNodeData(BaseNodeData):
    items: list[str] = []  # DANGEROUS!
```

**Why it's wrong:**
- Shared mutable default across all instances
- Changes persist between node instances
- Classic Python gotcha

**Correct:**
```python
from pydantic import Field

class MyNodeData(BaseNodeData):
    items: list[str] = Field(default_factory=list)
```

---

### ❌ Mistake 5: Not Using WorkflowNodeExecutionStatus

**Wrong:**
```python
def _run(self):
    return {
        'status': 'success',  # Wrong! Use enum
        'outputs': {'result': 'data'}
    }
```

**Correct:**
```python
from dify_custom_nodes.types import WorkflowNodeExecutionStatus

def _run(self):
    return {
        'status': WorkflowNodeExecutionStatus.SUCCEEDED,
        'outputs': {'result': 'data'}
    }
```

---

### ❌ Mistake 6: Logging Secrets

**Wrong:**
```python
def _run(self):
    api_key = self.get_input('api_key')
    logger.info(f"Using API key: {api_key}")  # LEAKED!
```

**Why it's wrong:**
- Secrets exposed in logs
- Security vulnerability

**Correct:**
```python
def _run(self):
    api_key = self.get_input('api_key')
    logger.info("Using configured API key")  # Don't log actual value
    # Or mask it
    logger.info(f"Using API key: {api_key[:8]}...")
```

---

## Frontend Mistakes

### ❌ Mistake 7: Not Using useConfig Hook

**Wrong:**
```typescript
const Panel = ({ id, data }) => {
  const [localData, setLocalData] = useState(data)  // Local state only

  return (
    <Input
      value={localData.field}
      onChange={(value) => setLocalData({ ...localData, field: value })}
    />
  )
}
```

**Why it's wrong:**
- Changes don't sync to backend
- Lost on page refresh
- Not saved to workflow

**Correct:**
```typescript
import { useConfig } from './use-config'

const Panel = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <Input
      value={inputs.field}
      onChange={handleFieldChange('field')}
    />
  )
}
```

---

### ❌ Mistake 8: Hardcoded Text (No i18n)

**Wrong:**
```typescript
<Field title="API Key">  {/* Hardcoded English */}
  <Input placeholder="Enter your API key" />
</Field>
```

**Why it's wrong:**
- Not translatable
- Dify supports multiple languages

**Correct:**
```typescript
import { useTranslation } from 'react-i18next'

const Panel = () => {
  const { t } = useTranslation()

  return (
    <Field title={t('workflow.nodes.myNode.apiKey')}>
      <Input placeholder={t('workflow.nodes.myNode.apiKeyPlaceholder')} />
    </Field>
  )
}
```

---

### ❌ Mistake 9: Not Memoizing Components

**Wrong:**
```typescript
export const MyNode = (props) => {
  // Heavy computation on every render
  const processedData = expensiveOperation(props.data)

  return <div>{processedData}</div>
}
```

**Why it's wrong:**
- Re-renders entire canvas when any node changes
- Performance degradation

**Correct:**
```typescript
import React, { useMemo } from 'react'

export const MyNode = React.memo((props) => {
  // Only recompute when data changes
  const processedData = useMemo(
    () => expensiveOperation(props.data),
    [props.data]
  )

  return <div>{processedData}</div>
})
```

---

### ❌ Mistake 10: Incorrect Handle IDs

**Wrong:**
```typescript
// Dynamic handle IDs that change
<Handle id={`output-${Math.random()}`} type="source" />
```

**Why it's wrong:**
- Connections break when IDs change
- Edges become invalid

**Correct:**
```typescript
// Stable IDs from data
<Handle id={item.id} type="source" />  // Use item's stable ID

// Or simple static IDs
<Handle id="source" type="source" />
```

---

## Variable System Mistakes

### ❌ Mistake 11: Hardcoded Node IDs

**Wrong:**
```python
def _run(self):
    # Assumes specific node ID
    value = self.get_variable(['node-123', 'output'])
```

**Why it's wrong:**
- Breaks if node ID changes
- Not reusable

**Correct:**
```python
def _run(self):
    # Let user select via VariableSelector
    var_selector = self._node_data.input_var
    value = self.get_variable(var_selector.value_selector)
```

---

### ❌ Mistake 12: Not Checking Variable Type

**Wrong:**
```python
def _run(self):
    count = self.get_variable(['node', 'count'])
    result = count + 10  # What if count is "5" (string)?
```

**Why it's wrong:**
- Type errors at runtime
- "5" + 10 → TypeError

**Correct:**
```python
def _run(self):
    count = self.get_variable(['node', 'count'])

    # Convert and validate
    try:
        count = int(count) if isinstance(count, str) else count
        if not isinstance(count, (int, float)):
            raise ValueError(f"Expected number, got {type(count)}")
    except (ValueError, TypeError) as e:
        return {
            'status': WorkflowNodeExecutionStatus.FAILED,
            'error': f"Invalid count value: {e}"
        }

    result = count + 10
```

---

### ❌ Mistake 13: Assuming Variable Exists

**Wrong:**
```python
def _run(self):
    var = self.get_variable(['upstream', 'data'])
    result = var['key']  # Crashes if var is None
```

**Why it's wrong:**
- Variable might not exist
- Upstream node might not have run
- None doesn't have ['key']

**Correct:**
```python
def _run(self):
    var = self.get_variable(['upstream', 'data'])

    if var is None:
        return {
            'status': WorkflowNodeExecutionStatus.FAILED,
            'error': 'Required input variable not found'
        }

    result = var.get('key', 'default')  # Safe access
```

---

## Edge/Handle Mistakes

### ❌ Mistake 14: Multiple Handles with Same ID

**Wrong:**
```typescript
{items.map(item => (
  <Handle
    key={item.name}
    id="output"  // SAME ID FOR ALL!
    type="source"
  />
))}
```

**Why it's wrong:**
- Only first handle works
- Others are invisible to ReactFlow

**Correct:**
```typescript
{items.map(item => (
  <Handle
    key={item.id}
    id={item.id}  // Unique ID per handle
    type="source"
  />
))}
```

---

### ❌ Mistake 15: Handles Without Position

**Wrong:**
```typescript
<Handle id="source" type="source" />  // Missing position
```

**Why it's wrong:**
- Handle appears in wrong location
- Confusing UX

**Correct:**
```typescript
import { Position } from 'reactflow'

<Handle id="source" type="source" position={Position.Right} />
```

---

## Performance Mistakes

### ❌ Mistake 16: Heavy Operations in _run() Without Error Handling

**Wrong:**
```python
def _run(self):
    # Long-running operation without timeout
    response = requests.get(url)  # Can hang forever
    data = response.json()
```

**Why it's wrong:**
- Can freeze workflow
- No timeout
- No error handling

**Correct:**
```python
def _run(self):
    try:
        response = requests.get(url, timeout=30)  # 30 second timeout
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.Timeout:
        return {
            'status': WorkflowNodeExecutionStatus.FAILED,
            'error': 'Request timed out after 30 seconds'
        }
    except requests.exceptions.RequestException as e:
        return {
            'status': WorkflowNodeExecutionStatus.FAILED,
            'error': f'Request failed: {str(e)}'
        }
```

---

### ❌ Mistake 17: Loading Large Data in Node Component

**Wrong:**
```typescript
const MyNode = ({ data }) => {
  // Heavy computation on every render
  const processedData = data.largeArray.map(item => {
    return expensiveTransform(item)  // Runs on every canvas update!
  })

  return <div>{processedData.length} items</div>
}
```

**Why it's wrong:**
- Slows down entire canvas
- Runs on every node change

**Correct:**
```typescript
const MyNode = React.memo(({ data }) => {
  // Only compute what's needed for display
  const count = data.largeArray?.length || 0

  return <div>{count} items</div>
})
```

---

### ❌ Mistake 18: Not Using Field default_factory

**Wrong:**
```python
class MyNodeData(BaseNodeData):
    items: list[dict] = []  # Shared mutable!
```

**Correct:**
```python
class MyNodeData(BaseNodeData):
    items: list[dict] = Field(default_factory=list)
```

---

## Validation Mistakes

### ❌ Mistake 19: Validating in Wrong Mode

**Wrong:**
```python
@field_validator('url', mode='after')  # Wrong mode
@classmethod
def validate_url(cls, v: str) -> str:
    return v.strip()  # Modifying value in 'after' mode
```

**Why it's wrong:**
- `mode='after'` is for validation only, not transformation
- Should use `mode='before'` for transformations

**Correct:**
```python
@field_validator('url', mode='before')  # Correct mode
@classmethod
def validate_url(cls, v: str) -> str:
    return v.strip()  # OK to transform in 'before' mode
```

---

### ❌ Mistake 20: Cross-Field Validation Without model_validator

**Wrong:**
```python
@field_validator('end_date')
@classmethod
def validate_end(cls, v: datetime, info: ValidationInfo) -> datetime:
    start = info.data.get('start_date')  # Might not exist yet!
    if start and v < start:
        raise ValueError("End must be after start")
    return v
```

**Why it's wrong:**
- Field order not guaranteed
- `start_date` might not be validated yet

**Correct:**
```python
@model_validator(mode='after')
def validate_dates(self):
    if self.end_date < self.start_date:
        raise ValueError("End date must be after start date")
    return self
```

---

## Checklist: Before Committing Your Node

### Backend
- [ ] Inherits from `BaseNodeData`
- [ ] All user inputs have `@field_validator`
- [ ] No mutable defaults (use `default_factory`)
- [ ] Error handling in `_run()`
- [ ] No secrets in logs
- [ ] Proper `WorkflowNodeExecutionStatus` usage

### Frontend
- [ ] Uses `useConfig` hook
- [ ] All text uses `t()` for i18n
- [ ] Components are memoized with `React.memo`
- [ ] Handle IDs are unique and stable
- [ ] Variables filtered by type when needed

### Variables
- [ ] No hardcoded node IDs
- [ ] Type checking for variable values
- [ ] Null checks before using variables
- [ ] Proper VariableSelector usage

### Testing
- [ ] Test with missing inputs
- [ ] Test with wrong types
- [ ] Test error cases
- [ ] Test edge connections

---

## See Also

- [Backend Patterns](./backend-patterns.md)
- [Frontend Patterns](./frontend-patterns.md)
- [Input Types](./input-types.md)
- [Variable System](./variable-system.md)

---

**Last Updated**: 2024-11-14
