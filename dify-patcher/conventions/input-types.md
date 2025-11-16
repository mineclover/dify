# Dify Input Types Reference

Complete reference for all input types used in Dify workflow nodes.

## Table of Contents

1. [Variable Selector](#variable-selector)
2. [Model Configuration](#model-configuration)
3. [Prompt Configuration](#prompt-configuration)
4. [String Inputs](#string-inputs)
5. [Numeric Inputs](#numeric-inputs)
6. [Boolean Inputs](#boolean-inputs)
7. [Object Inputs](#object-inputs)
8. [Array Inputs](#array-inputs)
9. [File Inputs](#file-inputs)
10. [Secret Inputs](#secret-inputs)

---

## Variable Selector

Used to reference outputs from other nodes in the workflow.

### Backend Definition

```python
from pydantic import BaseModel
from typing import Sequence

class VariableSelector(BaseModel):
    """
    Variable selector for referencing node outputs

    Format: [segment1, segment2, ...]
    Example: ['node-123', 'outputs', 'result']
    """
    variable: str                    # Variable name (for UI)
    value_selector: Sequence[str]    # Path to the variable
```

### Frontend Usage

```typescript
<VarReferencePicker
  nodeId={id}
  isShowNodeName
  availableVars={availableVars}
  value={inputs.variable_selector}
  onChange={(value) => handleFieldChange('variable_selector')(value)}
/>
```

### Common Patterns

**Single Variable Input:**
```python
class MyNodeData(BaseNodeData):
    variable: VariableSelector  # References one node output
```

**Multiple Variable Inputs:**
```python
class MyNodeData(BaseNodeData):
    variables: list[VariableSelector]  # References multiple outputs
```

**Example Values:**
- `['node-123', 'text']` - Text output from node-123
- `['sys', 'query']` - System query variable
- `['node-456', 'outputs', 'result', 'value']` - Nested object access

---

## Model Configuration

For LLM-based nodes that need model selection.

### Backend Definition

```python
from core.workflow.nodes.llm.entities import ModelConfig

class ModelConfig(BaseModel):
    """LLM model configuration"""
    provider: str          # e.g., 'openai', 'anthropic'
    name: str             # e.g., 'gpt-4', 'claude-3'
    mode: str             # 'completion' or 'chat'
    parameters: dict      # Temperature, max_tokens, etc.
```

### Usage

```python
class MyLLMNodeData(BaseNodeData):
    model: ModelConfig
```

### Frontend Component

```typescript
<ModelSelector
  value={inputs.model}
  onChange={handleFieldChange('model')}
  availableProviders={['openai', 'anthropic']}
/>
```

---

## Prompt Configuration

For nodes that use prompt templates.

### Backend Definition

```python
from core.workflow.nodes.llm.entities import PromptConfig

class PromptConfig(BaseModel):
    """Prompt configuration"""
    system_prompt: str | None = None
    user_prompt: str
    variables: list[VariableSelector] = []
```

### Chat vs Completion

**Chat Mode:**
```python
from typing import Literal

class ChatMessage(BaseModel):
    role: Literal['system', 'user', 'assistant']
    content: str

class PromptTemplate(BaseModel):
    messages: list[ChatMessage]
```

**Completion Mode:**
```python
class PromptTemplate(BaseModel):
    text: str
```

---

## String Inputs

### Basic String

```python
class MyNodeData(BaseNodeData):
    text: str = Field(
        default="",
        description="Text input"
    )
```

**Frontend:**
```typescript
<Input
  type="text"
  value={inputs.text}
  onChange={handleFieldChange('text')}
  placeholder="Enter text..."
/>
```

### Multi-line String (Paragraph)

```python
class MyNodeData(BaseNodeData):
    description: str = Field(
        default="",
        description="Long text input"
    )
```

**Frontend:**
```typescript
<Textarea
  rows={4}
  value={inputs.description}
  onChange={handleFieldChange('description')}
/>
```

### String with Enum (Select)

```python
from typing import Literal

class MyNodeData(BaseNodeData):
    method: Literal['GET', 'POST', 'PUT', 'DELETE'] = 'GET'
```

**Frontend:**
```typescript
<Select
  value={inputs.method}
  onChange={handleFieldChange('method')}
  options={[
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
  ]}
/>
```

### URL String

```python
from pydantic import HttpUrl, Field

class MyNodeData(BaseNodeData):
    url: str = Field(
        default="",
        description="URL input",
        pattern=r'^https?://.+'  # Regex validation
    )
```

---

## Numeric Inputs

### Integer

```python
class MyNodeData(BaseNodeData):
    count: int = Field(
        default=10,
        ge=1,        # Greater than or equal to 1
        le=100,      # Less than or equal to 100
        description="Count (1-100)"
    )
```

**Frontend:**
```typescript
<Input
  type="number"
  min={1}
  max={100}
  value={inputs.count}
  onChange={(value) => handleFieldChange('count')(Number(value))}
/>
```

### Float

```python
class MyNodeData(BaseNodeData):
    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Temperature (0.0-2.0)"
    )
```

---

## Boolean Inputs

```python
class MyNodeData(BaseNodeData):
    enabled: bool = Field(
        default=True,
        description="Enable feature"
    )
```

**Frontend:**
```typescript
<Checkbox
  checked={inputs.enabled}
  onChange={handleFieldChange('enabled')}
  label="Enable feature"
/>
```

**Toggle variant:**
```typescript
<Switch
  checked={inputs.enabled}
  onChange={handleFieldChange('enabled')}
/>
```

---

## Object Inputs

### Typed Object

```python
class AuthConfig(BaseModel):
    type: Literal['none', 'api_key', 'bearer']
    api_key: str | None = None

class MyNodeData(BaseNodeData):
    auth: AuthConfig = Field(
        default_factory=lambda: AuthConfig(type='none')
    )
```

### Generic Object (dict)

```python
class MyNodeData(BaseNodeData):
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata"
    )
```

**Frontend (JSON Editor):**
```typescript
<JsonEditor
  value={inputs.metadata}
  onChange={handleFieldChange('metadata')}
/>
```

---

## Array Inputs

### String Array

```python
class MyNodeData(BaseNodeData):
    tags: list[str] = Field(
        default_factory=list,
        description="Tags"
    )
```

**Frontend:**
```typescript
<TagInput
  value={inputs.tags}
  onChange={handleFieldChange('tags')}
  placeholder="Add tag..."
/>
```

### Object Array

```python
class Header(BaseModel):
    key: str
    value: str

class MyNodeData(BaseNodeData):
    headers: list[Header] = Field(
        default_factory=list,
        description="HTTP headers"
    )
```

**Frontend (List Editor):**
```typescript
<VarList
  list={inputs.headers}
  onChange={handleFieldChange('headers')}
  onAdd={() => {
    const newHeaders = [...inputs.headers, { key: '', value: '' }]
    handleFieldChange('headers')(newHeaders)
  }}
  onRemove={(index) => {
    const newHeaders = inputs.headers.filter((_, i) => i !== index)
    handleFieldChange('headers')(newHeaders)
  }}
>
  {(item, index) => (
    <>
      <Input
        placeholder="Key"
        value={item.key}
        onChange={(value) => {
          const newHeaders = [...inputs.headers]
          newHeaders[index].key = value
          handleFieldChange('headers')(newHeaders)
        }}
      />
      <Input
        placeholder="Value"
        value={item.value}
        onChange={(value) => {
          const newHeaders = [...inputs.headers]
          newHeaders[index].value = value
          handleFieldChange('headers')(newHeaders)
        }}
      />
    </>
  )}
</VarList>
```

---

## File Inputs

### Single File

```python
from core.workflow.entities.variable_pool import FileSegment

class MyNodeData(BaseNodeData):
    file: VariableSelector  # Points to a FileSegment variable
```

**Frontend:**
```typescript
<VarReferencePicker
  nodeId={id}
  availableVars={availableVars}
  value={inputs.file}
  onChange={handleFieldChange('file')}
  filterVar={(varPayload) => varPayload.type === VarType.File}
/>
```

### Multiple Files

```python
class MyNodeData(BaseNodeData):
    files: list[VariableSelector]  # Array of FileSegment references
```

---

## Secret Inputs

### API Key / Password

```python
class MyNodeData(BaseNodeData):
    api_key: str = Field(
        default="",
        description="API Key (secret)"
    )
```

**Frontend:**
```typescript
<Input
  type="password"
  value={inputs.api_key}
  onChange={handleFieldChange('api_key')}
  placeholder="Enter API key..."
/>
```

### Best Practices for Secrets

1. **Never log secrets**
2. **Mask in UI**: Always use `type="password"`
3. **Validate before use**: Check non-empty
4. **Use environment variables** when possible

```python
@field_validator('api_key', mode='before')
@classmethod
def validate_api_key(cls, v: str) -> str:
    if not v or not v.strip():
        raise ValueError("API key is required")
    # Don't log the actual value!
    return v.strip()
```

---

## Advanced Patterns

### Conditional Fields

Fields that appear based on other field values:

```python
from typing import Literal

class MyNodeData(BaseNodeData):
    auth_type: Literal['none', 'api_key', 'oauth'] = 'none'

    # Only required if auth_type is 'api_key'
    api_key: str | None = Field(
        default=None,
        description="API Key (required if auth_type is 'api_key')"
    )

    @model_validator(mode='after')
    def validate_auth(self):
        if self.auth_type == 'api_key' and not self.api_key:
            raise ValueError("API key is required when auth_type is 'api_key'")
        return self
```

**Frontend:**
```typescript
{inputs.auth_type === 'api_key' && (
  <Field title="API Key">
    <Input
      type="password"
      value={inputs.api_key}
      onChange={handleFieldChange('api_key')}
    />
  </Field>
)}
```

### Dynamic Options

Options that change based on other selections:

```python
class MyNodeData(BaseNodeData):
    provider: Literal['openai', 'anthropic']
    model: str  # Valid models depend on provider

    @model_validator(mode='after')
    def validate_model(self):
        valid_models = {
            'openai': ['gpt-4', 'gpt-3.5-turbo'],
            'anthropic': ['claude-3-opus', 'claude-3-sonnet']
        }
        if self.model not in valid_models[self.provider]:
            raise ValueError(f"Invalid model {self.model} for {self.provider}")
        return self
```

---

## Summary Table

| Type | Backend | Frontend Component | Use Case |
|------|---------|-------------------|----------|
| Variable Selector | `VariableSelector` | `VarReferencePicker` | Reference node outputs |
| Model Config | `ModelConfig` | `ModelSelector` | LLM model selection |
| Text | `str` | `Input` | Short text |
| Paragraph | `str` | `Textarea` | Long text |
| Select | `Literal[...]` | `Select` | Fixed options |
| Number | `int`, `float` | `Input type="number"` | Numeric input |
| Boolean | `bool` | `Checkbox`, `Switch` | On/off toggle |
| Object | `dict`, custom model | `JsonEditor` | Structured data |
| Array | `list[T]` | `VarList`, `TagInput` | Multiple items |
| File | `VariableSelector` | `VarReferencePicker` (filtered) | File upload |
| Secret | `str` | `Input type="password"` | API keys, passwords |

---

## See Also

- [Backend Patterns](./backend-patterns.md) - Complete backend patterns
- [Frontend Patterns](./frontend-patterns.md) - UI component patterns
- [Variable System](./variable-system.md) - Variable pool and selectors

---

**Last Updated**: 2024-11-14
