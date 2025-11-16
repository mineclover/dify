"""
Type definitions for Dify custom nodes

This module provides type hints and data models for custom node development.
"""

from enum import StrEnum
from typing import Any, TypedDict


class WorkflowNodeExecutionStatus(StrEnum):
    """Node execution status"""

    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    EXCEPTION = "exception"


class VarType(StrEnum):
    """Variable types supported in Dify workflows"""

    STRING = "string"
    NUMBER = "number"
    INTEGER = "integer"
    SECRET = "secret"
    BOOLEAN = "boolean"
    OBJECT = "object"
    FILE = "file"
    ARRAY = "array"
    ARRAY_STRING = "array[string]"
    ARRAY_NUMBER = "array[number]"
    ARRAY_OBJECT = "array[object]"
    ARRAY_FILE = "array[file]"


class InputVarType(StrEnum):
    """Input variable UI types"""

    TEXT_INPUT = "text-input"
    PARAGRAPH = "paragraph"
    SELECT = "select"
    NUMBER = "number"
    CHECKBOX = "checkbox"
    URL = "url"
    FILES = "files"
    JSON = "json"


class ErrorStrategy(StrEnum):
    """Error handling strategies"""

    TERMINATED = "terminated"
    CONTINUE_ON_ERROR = "continue-on-error"
    REMOVE_ABNORMAL_OUTPUT = "remove-abnormal-output"


class NodeRunResult(TypedDict, total=False):
    """
    Result returned from node execution

    Attributes:
        status: Execution status (succeeded/failed/exception)
        inputs: Input variables used (for logging)
        outputs: Output variables produced
        metadata: Additional metadata (optional)
        error: Error message if failed (optional)
    """

    status: WorkflowNodeExecutionStatus
    inputs: dict[str, Any]
    outputs: dict[str, Any]
    metadata: dict[str, Any]
    error: str


class NodeSchema(TypedDict, total=False):
    """
    Node schema definition for UI generation

    This follows JSON Schema format and is used to automatically
    generate the configuration UI in Dify frontend.

    Example:
        {
            "type": "object",
            "properties": {
                "api_url": {
                    "type": "string",
                    "title": "API URL",
                    "description": "The URL to call",
                    "format": "uri"
                },
                "timeout": {
                    "type": "integer",
                    "title": "Timeout (seconds)",
                    "default": 30,
                    "minimum": 1,
                    "maximum": 300
                }
            },
            "required": ["api_url"]
        }
    """

    type: str
    properties: dict[str, Any]
    required: list[str]


class OutputVar(TypedDict):
    """
    Output variable definition

    Attributes:
        variable: Variable name
        type: Variable type (string/number/object/etc)
        description: Human-readable description
    """

    variable: str
    type: VarType
    description: str


class Manifest(TypedDict, total=False):
    """
    Custom node manifest

    This is loaded from manifest.json in the node directory.

    Attributes:
        node_type: Unique node type identifier (e.g., 'weather-api')
        version: Node version (default: '1')
        name: Display name
        description: Node description
        author: Author name
        icon: Icon emoji or URL
        category: Node category for UI grouping
    """

    node_type: str
    version: str
    name: str
    description: str
    author: str
    icon: str
    category: str
    inputs: dict[str, Any]
    outputs: dict[str, Any]
