# Dify Backend Node Inputs and Data Structures - Pattern Analysis

## 1. BASE CLASSES AND INHERITANCE HIERARCHY

### BaseNodeData (Foundation for all nodes)
**File:** `/home/user/dify/api/core/workflow/nodes/base/entities.py`

```python
class BaseNodeData(ABC, BaseModel):
    """All node data classes inherit from this"""
    title: str
    desc: str | None = None
    version: str = "1"
    error_strategy: ErrorStrategy | None = None
    default_value: list[DefaultValue] | None = None
    retry_config: RetryConfig = RetryConfig()
    
    @property
    def default_value_dict(self) -> dict[str, Any]:
        """Convert default values to dictionary"""
        if self.default_value:
            return {item.key: item.value for item in self.default_value}
        return {}
```

**Key Pattern:**
- All node data inherits from `BaseNodeData`
- Pydantic `BaseModel` for data validation
- Common fields: `title`, `desc`, `version`, `error_strategy`, `retry_config`
- Uses `@property` for computed properties

### Specialized Node Data Classes

**RetryConfig** - Reusable retry configuration
```python
class RetryConfig(BaseModel):
    max_retries: int = 0
    retry_interval: int = 0  # milliseconds
    retry_enabled: bool = False
    
    @property
    def retry_interval_seconds(self) -> float:
        return self.retry_interval / 1000
```

**VariableSelector** - Used across multiple nodes
```python
class VariableSelector(BaseModel):
    variable: str
    value_selector: Sequence[str]  # Nested attribute access path
```

### Iteration/Loop Node Patterns
**File:** `/home/user/dify/api/core/workflow/nodes/base/entities.py`

```python
class BaseIterationNodeData(BaseNodeData):
    start_node_id: str | None = None

class BaseLoopNodeData(BaseNodeData):
    start_node_id: str | None = None

class BaseIterationState(BaseModel):
    """Generic state management for iteration nodes"""
    iteration_node_id: str
    index: int
    inputs: dict
    
    class MetaData(BaseModel):
        pass
    
    metadata: MetaData
```

**Pattern:** Generic base classes with nested MetaData inner classes for extensibility.

---

## 2. COMMON FIELD TYPES AND CONFIGURATIONS

### ModelConfig (Used in: LLM, Knowledge Retrieval, Question Classifier)
**File:** `/home/user/dify/api/core/workflow/nodes/llm/entities.py`

```python
class ModelConfig(BaseModel):
    """LLM model configuration"""
    provider: str
    name: str
    mode: LLMMode  # Enum for model mode
    completion_params: dict[str, Any] = Field(default_factory=dict)
```

**Usage Pattern:** Shared across nodes that interact with language models.

### MemoryConfig (Conversation Memory)
**File:** `/home/user/dify/api/core/prompt/entities/advanced_prompt_entities.py`

```python
class MemoryConfig(BaseModel):
    """Configuration for conversation memory in LLM nodes"""
    
    class RolePrefix(BaseModel):
        user: str
        assistant: str
    
    class WindowConfig(BaseModel):
        enabled: bool
        size: int | None = None
    
    role_prefix: RolePrefix | None = None
    window: WindowConfig
    query_prompt_template: str | None = None
```

**Pattern:** Nested inner classes for complex configurations with hierarchical structure.

### PromptConfig (Template Variables)
**File:** `/home/user/dify/api/core/workflow/nodes/llm/entities.py`

```python
class PromptConfig(BaseModel):
    jinja2_variables: Sequence[VariableSelector] = Field(default_factory=list)
    
    @field_validator("jinja2_variables", mode="before")
    @classmethod
    def convert_none_jinja2_variables(cls, v: Any):
        if v is None:
            return []
        return v
```

**Pattern:** Use `@field_validator` with `mode="before"` for flexible input conversion.

### VisionConfig (Image Support)
**File:** `/home/user/dify/api/core/workflow/nodes/llm/entities.py`

```python
class VisionConfigOptions(BaseModel):
    variable_selector: Sequence[str] = Field(default_factory=lambda: ["sys", "files"])
    detail: ImagePromptMessageContent.DETAIL = ImagePromptMessageContent.DETAIL.HIGH

class VisionConfig(BaseModel):
    enabled: bool = False
    configs: VisionConfigOptions = Field(default_factory=VisionConfigOptions)
    
    @field_validator("configs", mode="before")
    @classmethod
    def convert_none_configs(cls, v: Any):
        if v is None:
            return VisionConfigOptions()
        return v
```

**Pattern:** 
- Composite configuration with inner option classes
- Field defaults using callable factories
- Pre-validation converters for null/missing values

### ContextConfig (RAG Context)
**File:** `/home/user/dify/api/core/workflow/nodes/llm/entities.py`

```python
class ContextConfig(BaseModel):
    enabled: bool
    variable_selector: list[str] | None = None
```

**Pattern:** Simple boolean flag with optional selector.

---

## 3. VALIDATION PATTERNS

### Type Validation with Custom Validators
**File:** `/home/user/dify/api/core/workflow/nodes/base/entities.py`

```python
class DefaultValueType(StrEnum):
    STRING = "string"
    NUMBER = "number"
    OBJECT = "object"
    ARRAY_NUMBER = "array[number]"
    ARRAY_STRING = "array[string]"
    ARRAY_OBJECT = "array[object]"
    ARRAY_FILES = "array[file]"

class DefaultValue(BaseModel):
    value: Any = None
    type: DefaultValueType
    key: str
    
    @staticmethod
    def _validate_array(value: Any, element_type: type_ | tuple[type_, ...]) -> bool:
        return isinstance(value, list) and all(isinstance(x, element_type) for x in value)
    
    @staticmethod
    def _convert_number(value: str) -> float:
        try:
            return float(value)
        except ValueError:
            raise DefaultValueTypeError(f"Cannot convert to number: {value}")
    
    @model_validator(mode="after")
    def validate_value_type(self) -> "DefaultValue":
        """Complex validation after model construction"""
        type_validators = {
            DefaultValueType.STRING: {"type": str, "converter": lambda x: x},
            DefaultValueType.NUMBER: {"type": _NumberType, "converter": self._convert_number},
            DefaultValueType.OBJECT: {"type": dict, "converter": self._parse_json},
            DefaultValueType.ARRAY_NUMBER: {
                "type": list,
                "element_type": _NumberType,
                "converter": self._parse_json,
            },
            # ... more validators
        }
        validator = type_validators.get(self.type, {})
        # String input conversion
        if isinstance(self.value, str) and self.type != DefaultValueType.STRING:
            self.value = validator["converter"](self.value)
        # Type validation
        if not isinstance(self.value, validator["type"]):
            raise DefaultValueTypeError(...)
        # Element type validation for arrays
        if validator["type"] == list and not self._validate_array(self.value, validator["element_type"]):
            raise DefaultValueTypeError(...)
        return self
```

**Pattern:**
- Use `@model_validator(mode="after")` for complex post-construction validation
- Create type mappings dictionary for maintainable validation logic
- Implement helper static methods for reusable validation
- Raise domain-specific exceptions (`DefaultValueTypeError`)

### Conditional Validation
**File:** `/home/user/dify/api/core/workflow/nodes/http_request/entities.py`

```python
class HttpRequestNodeAuthorization(BaseModel):
    type: Literal["no-auth", "api-key"]
    config: HttpRequestNodeAuthorizationConfig | None = None
    
    @field_validator("config", mode="before")
    @classmethod
    def check_config(cls, v: HttpRequestNodeAuthorizationConfig, values: ValidationInfo):
        """Config is required only when type != 'no-auth'"""
        if values.data["type"] == "no-auth":
            return None
        else:
            if not v or not isinstance(v, dict):
                raise ValueError("config should be a dict")
            return v
```

**Pattern:** Use `ValidationInfo` to access other field values during validation.

### Input Type Validation
**File:** `/home/user/dify/api/core/workflow/nodes/tool/entities.py`

```python
class ToolNodeData(BaseNodeData, ToolEntity):
    class ToolInput(BaseModel):
        value: Union[Any, list[str]]
        type: Literal["mixed", "variable", "constant"]
        
        @field_validator("type", mode="before")
        @classmethod
        def check_type(cls, value, validation_info: ValidationInfo):
            """Validate that value matches its type"""
            typ = value
            value = validation_info.data.get("value")
            
            if value is None:
                return typ
            
            if typ == "mixed" and not isinstance(value, str):
                raise ValueError("value must be a string")
            elif typ == "variable":
                if not isinstance(value, list):
                    raise ValueError("value must be a list")
                for val in value:
                    if not isinstance(val, str):
                        raise ValueError("value must be a list of strings")
            elif typ == "constant" and not isinstance(value, str | int | float | bool | dict):
                raise ValueError("value must be a string, int, float, bool or dict")
            return typ
    
    tool_parameters: dict[str, ToolInput]
    
    @field_validator("tool_parameters", mode="before")
    @classmethod
    def filter_none_tool_inputs(cls, value):
        """Clean up inputs with None values"""
        if not isinstance(value, dict):
            return value
        return {
            key: tool_input
            for key, tool_input in value.items()
            if tool_input is not None and cls._has_valid_value(tool_input)
        }
```

**Pattern:** 
- Type-discriminated unions with validation
- Filtering/cleaning data during validation
- Static helper methods for reusable checks

### Type Constraints with Annotated
**File:** `/home/user/dify/api/core/workflow/nodes/code/entities.py`

```python
from typing import Annotated
from pydantic import AfterValidator

_ALLOWED_OUTPUT_FROM_CODE = frozenset([
    SegmentType.STRING,
    SegmentType.NUMBER,
    # ...
])

def _validate_type(segment_type: SegmentType) -> SegmentType:
    if segment_type not in _ALLOWED_OUTPUT_FROM_CODE:
        raise ValueError(f"invalid type for code output...")
    return segment_type

class CodeNodeData(BaseNodeData):
    class Output(BaseModel):
        type: Annotated[SegmentType, AfterValidator(_validate_type)]
        children: dict[str, Self] | None = None
```

**Pattern:** Use `Annotated` with validators for reusable field-level constraints.

---

## 4. NESTED STRUCTURE PATTERNS

### Recursive Self-Reference
**File:** `/home/user/dify/api/core/workflow/nodes/code/entities.py`

```python
class CodeNodeData(BaseNodeData):
    class Output(BaseModel):
        type: Annotated[SegmentType, AfterValidator(_validate_type)]
        children: dict[str, Self] | None = None  # Self-reference for recursion
```

**Pattern:** Use `Self` type hint for recursive data structures.

### Complex Nested Configurations
**File:** `/home/user/dify/api/core/workflow/nodes/knowledge_retrieval/entities.py`

```python
class VectorSetting(BaseModel):
    vector_weight: float
    embedding_provider_name: str
    embedding_model_name: str

class KeywordSetting(BaseModel):
    keyword_weight: float

class WeightedScoreConfig(BaseModel):
    vector_setting: VectorSetting
    keyword_setting: KeywordSetting

class MultipleRetrievalConfig(BaseModel):
    top_k: int
    score_threshold: float | None = None
    reranking_mode: str = "reranking_model"
    reranking_enable: bool = True
    reranking_model: RerankingModelConfig | None = None
    weights: WeightedScoreConfig | None = None

class KnowledgeRetrievalNodeData(BaseNodeData):
    type: str = "knowledge-retrieval"
    query_variable_selector: list[str]
    dataset_ids: list[str]
    retrieval_mode: Literal["single", "multiple"]
    multiple_retrieval_config: MultipleRetrievalConfig | None = None
    single_retrieval_config: SingleRetrievalConfig | None = None
    metadata_filtering_mode: Literal["disabled", "automatic", "manual"] | None = "disabled"
    metadata_model_config: ModelConfig | None = None
    metadata_filtering_conditions: MetadataFilteringCondition | None = None
    vision: VisionConfig = Field(default_factory=VisionConfig)
```

**Pattern:**
- Multiple levels of composition
- Optional nested configs based on mode/strategy
- Reusable sub-components across nodes

### State Management with Inner Classes
**File:** `/home/user/dify/api/core/workflow/nodes/iteration/entities.py`

```python
class IterationState(BaseIterationState):
    outputs: list[Any] = Field(default_factory=list)
    current_output: Any = None
    
    class MetaData(BaseIterationState.MetaData):
        """Extends parent's MetaData"""
        iterator_length: int
    
    def get_last_output(self) -> Any:
        if self.outputs:
            return self.outputs[-1]
        return None
```

**Pattern:** Extend base inner classes for specialized metadata.

### Conditional Nested Structures
**File:** `/home/user/dify/api/core/workflow/nodes/if_else/entities.py`

```python
class IfElseNodeData(BaseNodeData):
    class Case(BaseModel):
        case_id: str
        logical_operator: Literal["and", "or"]
        conditions: list[Condition]
    
    logical_operator: Literal["and", "or"] | None = "and"
    conditions: list[Condition] | None = Field(default=None, deprecated=True)
    cases: list[Case] | None = None  # New format
```

**Pattern:** Support both old and new formats with deprecation markers.

---

## 5. SPECIAL PATTERNS

### Enum-Based Discrimination
**File:** `/home/user/dify/api/core/workflow/nodes/iteration/entities.py`

```python
class ErrorHandleMode(StrEnum):
    TERMINATED = "terminated"
    CONTINUE_ON_ERROR = "continue-on-error"
    REMOVE_ABNORMAL_OUTPUT = "remove-abnormal-output"

class IterationNodeData(BaseIterationNodeData):
    error_handle_mode: ErrorHandleMode = ErrorHandleMode.TERMINATED
```

**Pattern:** Use string enums for configuration options.

### Alias Fields for Backward Compatibility
**File:** `/home/user/dify/api/core/workflow/nodes/llm/entities.py`

```python
class LLMNodeData(BaseNodeData):
    # Old field name 'structured_output_enabled' maps to 'structured_output_switch_on'
    structured_output_switch_on: bool = Field(False, alias="structured_output_enabled")
    
    @property
    def structured_output_enabled(self) -> bool:
        """Backward compatibility property"""
        return self.structured_output_switch_on and self.structured_output is not None
```

**Pattern:** Use `alias` parameter and properties for version migration.

### Computed Properties
**File:** `/home/user/dify/api/core/workflow/nodes/llm/entities.py`

```python
@property
def structured_output_enabled(self) -> bool:
    return self.structured_output_switch_on and self.structured_output is not None

@property
def default_value_dict(self) -> dict[str, Any]:
    if self.default_value:
        return {item.key: item.value for item in self.default_value}
    return {}
```

**Pattern:** Use `@property` for derived/computed fields that don't need storage.

### Literal Union Types
**File:** `/home/user/dify/api/core/workflow/nodes/http_request/entities.py`

```python
class HttpRequestNodeData(BaseNodeData):
    method: Literal[
        "get", "post", "put", "patch", "delete", "head", "options",
        "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS",
    ]
    url: str
    body: HttpRequestNodeBody | None = None
```

**Pattern:** Use `Literal` for strict enumeration of allowed values.

---

## 6. VARIABLE POOL AND SELECTOR PATTERNS

### Variable Pool Architecture
**File:** `/home/user/dify/api/core/workflow/runtime/variable_pool.py`

```python
class VariablePool(BaseModel):
    """Central repository for workflow variables"""
    
    # Two-level dictionary: [node_id][variable_name] -> Variable
    variable_dictionary: defaultdict[str, Annotated[dict[str, VariableUnion], Field(default_factory=dict)]] = Field(
        description="Variables mapping",
        default=defaultdict(dict),
    )
    
    user_inputs: Mapping[str, Any] = Field(description="User inputs", default_factory=dict)
    system_variables: SystemVariable = Field(description="System variables", default_factory=SystemVariable.empty)
    environment_variables: Sequence[VariableUnion] = Field(description="Environment variables.", default_factory=list)
    conversation_variables: Sequence[VariableUnion] = Field(description="Conversation variables.", default_factory=list)
    rag_pipeline_variables: list[RAGPipelineVariableInput] = Field(description="RAG pipeline variables.", default_factory=list)
    
    def add(self, selector: Sequence[str], value: Any, /):
        """
        Selector format: [node_id, variable_name]
        Validates selector has exactly 2 elements
        """
        if len(selector) != SELECTORS_LENGTH:
            raise ValueError(f"Invalid selector: expected {SELECTORS_LENGTH} elements")
        
        # Auto-convert value to Variable if needed
        if isinstance(value, Variable):
            variable = value
        elif isinstance(value, Segment):
            variable = variable_factory.segment_to_variable(segment=value, selector=selector)
        else:
            segment = variable_factory.build_segment(value)
            variable = variable_factory.segment_to_variable(segment=segment, selector=selector)
        
        node_id, name = self._selector_to_keys(selector)
        self.variable_dictionary[node_id][name] = cast(VariableUnion, variable)
    
    def get(self, selector: Sequence[str], /) -> Segment | None:
        """
        Get variable value, supports nested access:
        - [node_id, variable_name]: Full segment
        - [node_id, variable_name, attr, ...]: Nested attributes
        
        Handles FileSegment attributes (url, name, etc.) and ObjectSegment navigation
        """
        if len(selector) < SELECTORS_LENGTH:
            return None
        
        node_id, name = self._selector_to_keys(selector)
        segment: Segment | None = self.variable_dictionary.get(node_id, {}).get(name)
        
        if segment is None:
            return None
        
        if len(selector) == 2:
            return segment
        
        # Navigate through nested attributes
        if isinstance(segment, FileSegment):
            attr = selector[2]
            if attr not in {item.value for item in FileAttribute}:
                return None
            attr = FileAttribute(attr)
            attr_value = file_manager.get_attr(file=segment.value, attr=attr)
            return variable_factory.build_segment(attr_value)
        
        # Handle ObjectSegment navigation
        result: Any = segment
        for attr in selector[2:]:
            result = self._extract_value(result)
            result = self._get_nested_attribute(result, attr)
            if result is None:
                return None
        
        return result if isinstance(result, Segment) else variable_factory.build_segment(result)
```

**Key Patterns:**
- Two-level hierarchical variable storage
- Automatic type conversion to Variable/Segment
- Support for nested attribute access
- Selector validation (exactly 2 elements for basic add/get)
- Special handling for FileSegment vs ObjectSegment

### Variable Selector Usage
**File:** `/home/user/dify/api/core/workflow/nodes/base/entities.py`

```python
class VariableSelector(BaseModel):
    variable: str
    value_selector: Sequence[str]  # e.g., ["node_id", "variable_name", "nested.attr"]
```

**Pattern:** Reference variables using node_id + variable_name path.

---

## 7. ERROR HANDLING PATTERNS

### Exception Hierarchy
**File:** `/home/user/dify/api/core/workflow/nodes/base/exc.py`

```python
class BaseNodeError(ValueError):
    """Base class for node errors"""
    pass

class DefaultValueTypeError(BaseNodeError):
    """Raised when the default value type is invalid"""
    pass
```

**Pattern:** Create domain-specific exception hierarchies extending ValueError.

---

## 8. SIMPLE TO COMPLEX EXAMPLES

### Simple: Code Node
**File:** `/home/user/dify/api/core/workflow/nodes/code/entities.py`

```python
class CodeNodeData(BaseNodeData):
    """Simple node with basic fields"""
    
    class Output(BaseModel):
        type: Annotated[SegmentType, AfterValidator(_validate_type)]
        children: dict[str, Self] | None = None
    
    class Dependency(BaseModel):
        name: str
        version: str
    
    variables: list[VariableSelector]
    code_language: Literal[CodeLanguage.PYTHON3, CodeLanguage.JAVASCRIPT]
    code: str
    outputs: dict[str, Output]
    dependencies: list[Dependency] | None = None
```

**Simplicity Factors:**
- No complex validators beyond field-level
- Single level of nesting
- Few optional fields

### Medium: HTTP Request Node
**File:** `/home/user/dify/api/core/workflow/nodes/http_request/entities.py`

```python
class HttpRequestNodeAuthorizationConfig(BaseModel):
    type: Literal["basic", "bearer", "custom"]
    api_key: str
    header: str = ""

class HttpRequestNodeAuthorization(BaseModel):
    type: Literal["no-auth", "api-key"]
    config: HttpRequestNodeAuthorizationConfig | None = None
    
    @field_validator("config", mode="before")
    @classmethod
    def check_config(cls, v, values: ValidationInfo):
        if values.data["type"] == "no-auth":
            return None
        return v

class HttpRequestNodeBody(BaseModel):
    type: Literal["none", "form-data", "x-www-form-urlencoded", "raw-text", "json", "binary"]
    data: Sequence[BodyData] = Field(default_factory=list)
    
    @field_validator("data", mode="before")
    @classmethod
    def check_data(cls, v: Any):
        if not v:
            return []
        if isinstance(v, str):
            return [BodyData(key="", type="text", value=v)]
        return v

class HttpRequestNodeTimeout(BaseModel):
    connect: int = dify_config.HTTP_REQUEST_MAX_CONNECT_TIMEOUT
    read: int = dify_config.HTTP_REQUEST_MAX_READ_TIMEOUT
    write: int = dify_config.HTTP_REQUEST_MAX_WRITE_TIMEOUT

class HttpRequestNodeData(BaseNodeData):
    method: Literal["get", "post", "put", "patch", "delete", "head", "options", ...]
    url: str
    authorization: HttpRequestNodeAuthorization
    headers: str
    params: str
    body: HttpRequestNodeBody | None = None
    timeout: HttpRequestNodeTimeout | None = None
    ssl_verify: bool | None = dify_config.HTTP_REQUEST_NODE_SSL_VERIFY
```

**Complexity Factors:**
- Conditional nested structures
- Input normalization validators
- Configuration composition

### Complex: LLM Node
**File:** `/home/user/dify/api/core/workflow/nodes/llm/entities.py`

```python
class LLMNodeData(BaseNodeData):
    model: ModelConfig
    prompt_template: Sequence[LLMNodeChatModelMessage] | LLMNodeCompletionModelPromptTemplate
    prompt_config: PromptConfig = Field(default_factory=PromptConfig)
    memory: MemoryConfig | None = None
    context: ContextConfig
    vision: VisionConfig = Field(default_factory=VisionConfig)
    structured_output: Mapping[str, Any] | None = None
    structured_output_switch_on: bool = Field(False, alias="structured_output_enabled")
    reasoning_format: Literal["separated", "tagged"] = Field(
        default="tagged",
        description="Strategy for handling model reasoning output...",
    )
    
    @field_validator("prompt_config", mode="before")
    @classmethod
    def convert_none_prompt_config(cls, v: Any):
        if v is None:
            return PromptConfig()
        return v
    
    @property
    def structured_output_enabled(self) -> bool:
        return self.structured_output_switch_on and self.structured_output is not None
```

**Complexity Factors:**
- Multiple configuration objects
- Type unions (chat vs completion prompts)
- Backward compatibility (aliases)
- Computed properties
- Rich docstrings with descriptions

---

## 9. FIELD DEFAULTS PATTERNS

### Factory Functions
```python
Field(default_factory=dict)                    # Empty dict
Field(default_factory=list)                    # Empty list
Field(default_factory=PromptConfig)            # New instance
Field(default_factory=lambda: ["sys", "files"]) # Computed default
Field(default_factory=VisionConfig)            # Nested config instance
```

### Direct Defaults
```python
version: str = "1"
enabled: bool = False
title: str                          # Required
retry_enabled: bool = False
error_handle_mode: ErrorHandleMode = ErrorHandleMode.TERMINATED
```

### Optional with None
```python
memory: MemoryConfig | None = None
instruction: str | None = None
dependency: list[Dependency] | None = None
```

---

## 10. SUMMARY OF KEY PATTERNS

| Pattern | Purpose | Example |
|---------|---------|---------|
| **BaseNodeData** | Common node interface | All nodes inherit from this |
| **Field(default_factory=...)** | Mutable default values | `list[VariableSelector]` |
| **Literal[...]** | Strict string enums | `method: Literal["get", "post"]` |
| **Union types** | Multiple option types | `Sequence[...] \| CompletionTemplate` |
| **Inner classes** | Grouped configurations | `ModelConfig`, `MemoryConfig` |
| **@field_validator(mode="before")** | Pre-validation conversion | Null handling, type coercion |
| **@model_validator(mode="after")** | Cross-field validation | Complex dependent validation |
| **@property** | Computed fields | `structured_output_enabled` |
| **Field(alias=...)** | Backward compatibility | `structured_output_switch_on` |
| **Annotated[Type, Validator]** | Reusable field constraints | Type enumeration |
| **StrEnum/Literal** | String-based enumerations | Error modes, input types |
| **Self type hint** | Recursive structures | Tree/nested structures |
| **ValidationInfo** | Cross-field context | Conditional validation |

