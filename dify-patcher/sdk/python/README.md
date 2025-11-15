# Dify Custom Nodes - Python SDK

A Python SDK for developing custom workflow nodes for Dify with a clean, simple API.

## Installation

```bash
pip install -e .
```

## Quick Start

```python
from dify_custom_nodes import BaseCustomNode, register_node, NodeRunResult
from dify_custom_nodes.types import VarType, WorkflowNodeExecutionStatus

@register_node('hello-world', version='1')
class HelloWorldNode(BaseCustomNode):
    """A simple hello world custom node"""

    @classmethod
    def get_schema(cls):
        return {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "title": "Name",
                    "description": "Name to greet"
                }
            },
            "required": ["name"]
        }

    @classmethod
    def get_output_vars(cls, payload=None):
        return [
            {
                "variable": "greeting",
                "type": VarType.STRING,
                "description": "Greeting message"
            }
        ]

    def _run(self) -> NodeRunResult:
        name = self.get_input('name', 'World')

        return {
            'status': WorkflowNodeExecutionStatus.SUCCEEDED,
            'inputs': {'name': name},
            'outputs': {
                'greeting': f'Hello, {name}!'
            }
        }
```

## Features

- **Simple API**: Clean abstraction over Dify's core Node class
- **Type Safety**: Full type hints and Pydantic validation
- **Auto-discovery**: Nodes are automatically discovered and registered
- **Schema-based UI**: JSON Schema automatically generates configuration UI

## API Reference

### `@register_node(node_type, version='1', **metadata)`

Decorator to register a custom node.

**Parameters:**
- `node_type` (str): Unique identifier (e.g., 'weather-api')
- `version` (str): Node version (default: '1')
- `**metadata`: Additional metadata (author, description, etc.)

### `BaseCustomNode`

Base class for all custom nodes.

**Methods to implement:**
- `get_schema()`: Return JSON Schema for configuration
- `get_output_vars()`: Define output variables
- `_run()`: Execute node logic

**Utility methods:**
- `get_input(key, default)`: Get configuration value
- `get_variable(selector)`: Get workflow variable
- `validate_inputs(inputs)`: Custom validation (optional)

## Examples

See the `examples/` directory for complete examples:
- Weather API node
- Database query node
- HTTP request node

## License

MIT
