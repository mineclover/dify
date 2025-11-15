"""
Dify Custom Nodes SDK

A Python SDK for developing custom workflow nodes for Dify.

Example:
    >>> from dify_custom_nodes import BaseCustomNode, register_node
    >>> from dify_custom_nodes.types import NodeRunResult
    >>>
    >>> @register_node('my-custom-node', version='1')
    >>> class MyCustomNode(BaseCustomNode):
    ...     def _run(self) -> NodeRunResult:
    ...         return NodeRunResult(
    ...             status='succeeded',
    ...             outputs={'result': 'Hello World'}
    ...         )
"""

__version__ = "0.1.0"

from dify_custom_nodes.base_node import BaseCustomNode
from dify_custom_nodes.decorators import register_node
from dify_custom_nodes.types import (
    NodeRunResult,
    NodeSchema,
    WorkflowNodeExecutionStatus,
)

__all__ = [
    "BaseCustomNode",
    "register_node",
    "NodeRunResult",
    "NodeSchema",
    "WorkflowNodeExecutionStatus",
]
