# Dify Node Patterns - Quick Reference Guide

## File Locations

| Component | File Path |
|-----------|-----------|
| Base Node Data | `/home/user/dify/api/core/workflow/nodes/base/entities.py` |
| Exceptions | `/home/user/dify/api/core/workflow/nodes/base/exc.py` |
| Variable Pool | `/home/user/dify/api/core/workflow/runtime/variable_pool.py` |
| Advanced Prompts | `/home/user/dify/api/core/prompt/entities/advanced_prompt_entities.py` |
| **Node Types:** | |
| LLM Node | `/home/user/dify/api/core/workflow/nodes/llm/entities.py` |
| Code Node | `/home/user/dify/api/core/workflow/nodes/code/entities.py` |
| HTTP Request Node | `/home/user/dify/api/core/workflow/nodes/http_request/entities.py` |
| Tool Node | `/home/user/dify/api/core/workflow/nodes/tool/entities.py` |
| Agent Node | `/home/user/dify/api/core/workflow/nodes/agent/entities.py` |
| If/Else Node | `/home/user/dify/api/core/workflow/nodes/if_else/entities.py` |
| Iteration Node | `/home/user/dify/api/core/workflow/nodes/iteration/entities.py` |
| Knowledge Retrieval | `/home/user/dify/api/core/workflow/nodes/knowledge_retrieval/entities.py` |
| Question Classifier | `/home/user/dify/api/core/workflow/nodes/question_classifier/entities.py` |
| Template Transform | `/home/user/dify/api/core/workflow/nodes/template_transform/entities.py` |
| Variable Assigner | `/home/user/dify/api/core/workflow/nodes/variable_assigner/v2/entities.py` |

---

## Reusable Components

### Shared Configuration Classes

1. **ModelConfig** (LLM, Knowledge Retrieval, Question Classifier)
   - `provider: str`
   - `name: str`
   - `mode: LLMMode`
   - `completion_params: dict[str, Any]`

2. **MemoryConfig** (LLM, Agent, Question Classifier)
   - `role_prefix: RolePrefix | None`
   - `window: WindowConfig`
   - `query_prompt_template: str | None`

3. **VisionConfig** (LLM, Knowledge Retrieval, Question Classifier)
   - `enabled: bool`
   - `configs: VisionConfigOptions`

4. **PromptConfig** (LLM Node)
   - `jinja2_variables: Sequence[VariableSelector]`

5. **RetryConfig** (All nodes)
   - `max_retries: int`
   - `retry_interval: int`
   - `retry_enabled: bool`

---

## Common Patterns

### 1. Field with Factory Default
```python
field_name: FieldType = Field(default_factory=DefaultClass)
```
**Use cases:** Lists, dicts, nested objects

### 2. Optional Configuration
```python
field_name: ConfigClass | None = None
```
**Use cases:** Features that can be disabled

### 3. Pre-validation Conversion
```python
@field_validator("field_name", mode="before")
@classmethod
def convert_field(cls, v: Any):
    if v is None:
        return DefaultValue()
    return v
```
**Use cases:** Handle null values, coerce types

### 4. Cross-field Validation
```python
@field_validator("config", mode="before")
@classmethod
def check_config(cls, v, values: ValidationInfo):
    if values.data["type"] == "some-type":
        # Custom validation
    return v
```
**Use cases:** Conditional validation based on other fields

### 5. Complex Type Validation
```python
@model_validator(mode="after")
def validate_all_fields(self) -> "ClassName":
    # Complex validation logic
    return self
```
**Use cases:** Validation that needs all fields, cross-field dependencies

### 6. Backward Compatibility
```python
field_name: Type = Field(default_value, alias="old_field_name")

@property
def old_field_name(self) -> Type:
    # Convert to new format
    return self.field_name
```
**Use cases:** Version migrations, field renames

### 7. Recursive/Tree Structures
```python
class Node(BaseModel):
    value: str
    children: dict[str, Self] | None = None
```
**Use cases:** Nested tree structures, recursive configurations

---

## Variable Selector Patterns

### Basic Selector
```python
variables: list[VariableSelector]
# Where VariableSelector = {
#     "variable": "node_id",
#     "value_selector": ["node_id", "variable_name"]
# }
```

### Nested Access Pattern
```python
selector = ["node_id", "variable_name", "nested", "attribute"]
# First 2 elements: identify variable
# Remaining elements: navigate nested structure
```

---

## Validation Exception Pattern

```python
class BaseNodeError(ValueError):
    """Domain-specific error base class"""
    pass

class SpecificNodeError(BaseNodeError):
    """Specific error for this domain"""
    pass

# Usage
if not valid:
    raise SpecificNodeError(f"Error message with context: {value}")
```

---

## Node Data Inheritance Hierarchy

```
BaseModel
  ├── BaseNodeData (ABC)
  │   ├── LLMNodeData
  │   ├── CodeNodeData
  │   ├── HttpRequestNodeData
  │   ├── ToolNodeData
  │   ├── AgentNodeData
  │   ├── KnowledgeRetrievalNodeData
  │   ├── QuestionClassifierNodeData
  │   ├── IfElseNodeData
  │   ├── TemplateTransformNodeData
  │   ├── VariableAssignerNodeData
  │   ├── BaseIterationNodeData
  │   │   └── IterationNodeData
  │   ├── BaseLoopNodeData
  │   │   └── LoopNodeData
  │   └── ...
  └── Other model types (RetryConfig, VariableSelector, etc.)
```

---

## Type Annotation Patterns

### Basic Types
```python
title: str                    # Required string
desc: str | None = None       # Optional string
enabled: bool = False         # Boolean with default
count: int = 0               # Integer with default
value: float = 1.0           # Float with default
```

### Container Types
```python
items: list[ItemType]                          # Required list
configs: dict[str, ConfigType] = Field(...)    # Dict with factory
selectors: Sequence[str]                       # Sequence (flexible)
mapping: Mapping[str, Value]                   # Mapping (readonly)
```

### Union/Optional Types
```python
config: ConfigA | ConfigB                      # Type union
output: str | int | float                      # Value union
optional: ConfigType | None = None             # Optional config
discriminated: Literal["a", "b", "c"]          # Literal enum
```

### Special Types
```python
recursive: dict[str, Self] | None = None       # Self-reference
any_value: Any = None                          # Untyped (avoid!)
generator: Iterable[Item]                      # Abstract iterable
```

---

## Common Enum Patterns

### String Enum (Configuration Options)
```python
from enum import StrEnum

class ErrorHandleMode(StrEnum):
    TERMINATED = "terminated"
    CONTINUE_ON_ERROR = "continue-on-error"
    REMOVE_ABNORMAL_OUTPUT = "remove-abnormal-output"
```

### Literal Enum (Fixed Set)
```python
method: Literal["get", "post", "put", "patch", "delete"]
type: Literal["form-data", "json", "raw-text"]
```

---

## Pydantic Features Used

| Feature | Purpose | Location |
|---------|---------|----------|
| `BaseModel` | Data validation | All entity classes |
| `Field(default_factory=...)` | Mutable defaults | Collection fields |
| `Field(alias=...)` | Alternative field name | Backward compatibility |
| `@field_validator` | Single field validation | All nodes |
| `@model_validator` | Multi-field validation | Complex validation |
| `ValidationInfo` | Context during validation | Cross-field checks |
| `Annotated[Type, Validator]` | Reusable constraints | Field-level rules |
| `ABC` | Abstract base class | BaseNodeData |
| `@property` | Computed fields | Derived values |

---

## Best Practices from Codebase

1. **Always inherit from BaseNodeData** for workflow nodes
2. **Use Pydantic Field()** for collections to avoid mutable defaults
3. **Validate early** with `@field_validator(mode="before")` for conversions
4. **Use descriptive names** and docstrings for complex types
5. **Create reusable configs** as separate classes (ModelConfig, MemoryConfig, etc.)
6. **Support backward compatibility** with aliases and computed properties
7. **Raise domain-specific exceptions** extending BaseNodeError
8. **Use Literal/StrEnum** instead of plain strings for options
9. **Compose configs** using nested classes for clarity
10. **Document complex fields** with detailed descriptions in Field()

---

## Testing Node Data Classes

When creating test fixtures:

```python
from pydantic import ValidationError

# Valid instance
node_data = MyNodeData(
    title="Node Title",
    variables=[...],
    # ... other required fields
)

# Test validation failures
with pytest.raises(ValidationError) as exc:
    MyNodeData(invalid_field="value")

# Test default values
assert node_data.version == "1"
assert node_data.retry_config.max_retries == 0

# Test computed properties
assert node_data.default_value_dict == {}
```

