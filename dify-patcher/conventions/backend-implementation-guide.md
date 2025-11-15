# Creating a New Node Type - Implementation Guide

Based on Dify patterns analyzed from the codebase.

## Step 1: Define Node Data Class

### Basic Template
```python
# File: api/core/workflow/nodes/my_feature/entities.py

from typing import Any, Literal, Sequence
from pydantic import BaseModel, Field, field_validator
from core.workflow.nodes.base import BaseNodeData
from core.workflow.nodes.base.entities import VariableSelector


class MyFeatureConfig(BaseModel):
    """Reusable configuration for this feature"""
    enabled: bool
    option_selector: list[str] | None = None
    timeout: int = 30


class MyFeatureNodeData(BaseNodeData):
    """
    My Feature Node Data.
    
    Description of what this node does and how it processes data.
    """
    
    # Required fields (no default)
    title: str  # Inherited from BaseNodeData
    feature_type: Literal["type_a", "type_b"]
    configuration: MyFeatureConfig
    
    # Optional fields
    variables: list[VariableSelector] = Field(default_factory=list)
    description: str | None = None
    advanced_config: MyFeatureConfig | None = None
    
    # Fields with defaults
    parallel_enabled: bool = False
    max_retries: int = 3
    
    @field_validator("variables", mode="before")
    @classmethod
    def convert_none_variables(cls, v: Any):
        """Handle null variables during deserialization"""
        if v is None:
            return []
        return v
```

### Advanced Template (Complex Validation)
```python
from pydantic import ValidationInfo, field_validator, model_validator


class MyAdvancedNodeData(BaseNodeData):
    """Advanced node with cross-field validation"""
    
    mode: Literal["simple", "advanced"]
    simple_config: SimpleConfig | None = None
    advanced_config: AdvancedConfig | None = None
    
    @field_validator("simple_config", mode="before")
    @classmethod
    def validate_simple_config(cls, v: Any, values: ValidationInfo):
        """Validate simple_config is provided when mode='simple'"""
        if values.data.get("mode") == "simple" and v is None:
            raise ValueError("simple_config is required when mode='simple'")
        return v
    
    @model_validator(mode="after")
    def validate_configs(self) -> "MyAdvancedNodeData":
        """Validate config consistency after object creation"""
        if self.mode == "simple":
            if self.advanced_config is not None:
                raise ValueError("advanced_config should be None when mode='simple'")
        elif self.mode == "advanced":
            if self.advanced_config is None:
                raise ValueError("advanced_config is required when mode='advanced'")
        
        return self
```

---

## Step 2: Define Node Exceptions

### Exception Pattern
```python
# File: api/core/workflow/nodes/my_feature/exc.py

from core.workflow.nodes.base.exc import BaseNodeError


class MyFeatureNodeError(BaseNodeError):
    """Base exception for my feature node errors"""
    pass


class InvalidConfigError(MyFeatureNodeError):
    """Raised when configuration is invalid"""
    pass


class ExecutionError(MyFeatureNodeError):
    """Raised when node execution fails"""
    pass
```

---

## Step 3: Create Configuration Classes

### Reusable Config Pattern
```python
# Within entities.py or separate module

class SourceConfig(BaseModel):
    """Configuration for data source"""
    type: Literal["api", "database", "file"]
    endpoint: str | None = None
    credentials: dict[str, str] | None = None


class TransformConfig(BaseModel):
    """Configuration for data transformation"""
    enabled: bool = True
    operations: list[str] = Field(default_factory=list)
    custom_params: dict[str, Any] = Field(default_factory=dict)


class OutputConfig(BaseModel):
    """Configuration for output handling"""
    format: Literal["json", "csv", "xml"] = "json"
    include_metadata: bool = False
```

### Nested Inner Classes Pattern
```python
class MyNodeData(BaseNodeData):
    """Node with nested configuration classes"""
    
    class AuthConfig(BaseModel):
        type: Literal["basic", "bearer", "custom"]
        credentials: str
        headers: dict[str, str] | None = None
    
    class RateLimitConfig(BaseModel):
        enabled: bool = False
        requests_per_minute: int = 60
    
    auth: AuthConfig
    rate_limit: RateLimitConfig = Field(default_factory=RateLimitConfig)
```

---

## Step 4: Implement Validation Logic

### Pre-validation (Before Construction)
```python
@field_validator("options", mode="before")
@classmethod
def normalize_options(cls, v: Any):
    """Normalize input before validation"""
    if v is None:
        return []
    if isinstance(v, str):
        return [v]  # Convert single string to list
    return v
```

### Post-validation (After Construction)
```python
@model_validator(mode="after")
def validate_dependencies(self) -> "MyNodeData":
    """Validate field dependencies after construction"""
    # Check that values are consistent
    if self.timeout <= 0:
        raise ValueError("timeout must be positive")
    
    if self.max_retries > 5:
        raise ValueError("max_retries cannot exceed 5")
    
    return self
```

### Cross-field Validation
```python
@field_validator("secondary_field", mode="before")
@classmethod
def validate_secondary(cls, v: Any, values: ValidationInfo):
    """Validate based on another field's value"""
    primary = values.data.get("primary_field")
    
    if primary == "type_a" and v is None:
        raise ValueError("secondary_field required when primary_field='type_a'")
    
    return v
```

---

## Step 5: Implement Computed Properties

```python
class MyNodeData(BaseNodeData):
    """Node with computed properties"""
    
    enabled_features: list[str] = Field(default_factory=list)
    feature_config: dict[str, Any] = Field(default_factory=dict)
    
    @property
    def active_feature_count(self) -> int:
        """Computed property: count of enabled features"""
        return len([f for f in self.enabled_features if f])
    
    @property
    def has_advanced_config(self) -> bool:
        """Computed property: whether advanced config is present"""
        return bool(self.feature_config)
    
    @property
    def config_summary(self) -> dict[str, Any]:
        """Computed property: summary of configuration"""
        return {
            "active_features": self.active_feature_count,
            "has_advanced": self.has_advanced_config,
        }
```

---

## Step 6: Backward Compatibility

```python
from pydantic import Field


class MyNodeData(BaseNodeData):
    """Node with backward-compatible fields"""
    
    # New field name with alias to old field
    feature_enabled: bool = Field(
        default=False,
        alias="is_feature_enabled"  # Accept old name in input
    )
    
    # New config format with deprecated old format
    new_config: dict[str, Any] = Field(default_factory=dict)
    old_config: dict[str, Any] | None = Field(
        default=None,
        deprecated=True  # Mark as deprecated
    )
    
    @field_validator("new_config", mode="before")
    @classmethod
    def migrate_old_config(cls, v: Any, values: ValidationInfo):
        """Migrate from old to new config format"""
        if v is not None:
            return v
        
        # If new_config not provided, migrate from old_config
        old_config = values.data.get("old_config")
        if old_config:
            # Migration logic
            return cls._migrate_config(old_config)
        
        return {}
    
    @staticmethod
    def _migrate_config(old_config: dict) -> dict:
        """Convert old config format to new format"""
        return {
            "new_field": old_config.get("legacy_field"),
            # ... mapping logic
        }
    
    @property
    def feature_enabled_compat(self) -> bool:
        """Backward compatibility property"""
        return self.feature_enabled
```

---

## Step 7: Practical Example - File Processing Node

```python
# File: api/core/workflow/nodes/file_processor/entities.py

from typing import Any, Literal, Sequence
from pydantic import BaseModel, Field, field_validator
from core.workflow.nodes.base import BaseNodeData
from core.workflow.nodes.base.entities import VariableSelector


class FileFilterConfig(BaseModel):
    """Configuration for filtering files"""
    enabled: bool = False
    include_patterns: list[str] = Field(default_factory=list)
    exclude_patterns: list[str] = Field(default_factory=list)
    min_size_bytes: int | None = None
    max_size_bytes: int | None = None


class ProcessingConfig(BaseModel):
    """Configuration for file processing"""
    timeout_seconds: int = 300
    max_workers: int = 4
    skip_errors: bool = False


class FileProcessorNodeData(BaseNodeData):
    """
    File Processor Node.
    
    Processes files with configurable filtering and processing options.
    Supports parallel processing and error handling strategies.
    """
    
    # Input selection
    file_selector: list[str]  # Variable selector for input files
    
    # Processing type
    process_type: Literal["extract", "validate", "transform"]
    
    # Configuration
    filter_config: FileFilterConfig = Field(default_factory=FileFilterConfig)
    process_config: ProcessingConfig = Field(default_factory=ProcessingConfig)
    
    # Optional processing instructions
    custom_instructions: str | None = None
    
    # Output format
    output_format: Literal["json", "csv", "original"] = "json"
    
    @field_validator("file_selector")
    @classmethod
    def validate_selector(cls, v: Any):
        """Ensure selector is provided"""
        if not v:
            raise ValueError("file_selector is required")
        return v
    
    @field_validator("process_config", mode="before")
    @classmethod
    def validate_workers(cls, v: Any):
        """Validate worker configuration"""
        if isinstance(v, dict) and v.get("max_workers", 4) > 16:
            raise ValueError("max_workers cannot exceed 16")
        return v
    
    @model_validator(mode="after")
    def validate_processing_config(self) -> "FileProcessorNodeData":
        """Validate processing configuration consistency"""
        if self.process_config.timeout_seconds < 10:
            raise ValueError("timeout_seconds must be at least 10")
        
        if self.filter_config.enabled:
            if (self.filter_config.max_size_bytes and 
                self.filter_config.min_size_bytes and
                self.filter_config.min_size_bytes > self.filter_config.max_size_bytes):
                raise ValueError("min_size_bytes cannot exceed max_size_bytes")
        
        return self
    
    @property
    def is_parallel(self) -> bool:
        """Check if parallel processing is enabled"""
        return self.process_config.max_workers > 1
    
    @property
    def filtering_enabled(self) -> bool:
        """Check if any filtering is configured"""
        return (self.filter_config.enabled or 
                bool(self.filter_config.include_patterns))
```

---

## Step 8: Testing Template

```python
# File: api/core/workflow/nodes/my_feature/test_entities.py

import pytest
from pydantic import ValidationError
from .entities import MyFeatureNodeData, MyFeatureConfig


class TestMyFeatureNodeData:
    """Test suite for MyFeatureNodeData"""
    
    def test_basic_creation(self):
        """Test creating valid node data"""
        node_data = MyFeatureNodeData(
            title="Test Node",
            feature_type="type_a",
            configuration=MyFeatureConfig(enabled=True),
        )
        
        assert node_data.title == "Test Node"
        assert node_data.version == "1"
        assert node_data.retry_config.max_retries == 0
    
    def test_required_fields(self):
        """Test that required fields are enforced"""
        with pytest.raises(ValidationError):
            MyFeatureNodeData(title="Test")  # Missing required fields
    
    def test_default_values(self):
        """Test that defaults are applied correctly"""
        node_data = MyFeatureNodeData(
            title="Test",
            feature_type="type_a",
            configuration=MyFeatureConfig(enabled=True),
        )
        
        assert node_data.variables == []
        assert node_data.description is None
        assert node_data.parallel_enabled is False
    
    def test_validation_error(self):
        """Test validation failure handling"""
        with pytest.raises(ValidationError) as exc_info:
            MyFeatureNodeData(
                title="Test",
                feature_type="invalid_type",  # Invalid literal
                configuration=MyFeatureConfig(enabled=True),
            )
        
        assert "invalid_type" in str(exc_info.value)
    
    def test_computed_properties(self):
        """Test computed property values"""
        node_data = MyFeatureNodeData(
            title="Test",
            feature_type="type_a",
            configuration=MyFeatureConfig(enabled=True),
        )
        
        assert node_data.config_summary["has_advanced"] is False
```

---

## File Structure Checklist

When creating a new node type:

```
api/core/workflow/nodes/my_feature/
├── __init__.py                  # Export main classes
├── entities.py                  # Data classes (primary file)
├── exc.py                       # Exception classes
├── my_feature_node.py           # Node implementation (if needed)
└── test_entities.py             # Unit tests
```

### __init__.py Template
```python
from .entities import MyFeatureNodeData
from .my_feature_node import MyFeatureNode

__all__ = ["MyFeatureNode", "MyFeatureNodeData"]
```

---

## Summary of Patterns

1. Always inherit from `BaseNodeData`
2. Use `Field(default_factory=...)` for mutable defaults
3. Use `@field_validator(mode="before")` for input normalization
4. Use `@model_validator(mode="after")` for complex validation
5. Create reusable config classes as `BaseModel` subclasses
6. Implement `@property` for computed fields
7. Use `Literal` for configuration options
8. Use `ValidationInfo` for cross-field validation
9. Raise domain-specific exceptions
10. Support backward compatibility with aliases

