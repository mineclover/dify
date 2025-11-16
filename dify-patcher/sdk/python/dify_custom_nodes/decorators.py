"""
Decorators for custom node registration

This module provides the @register_node decorator for automatic
node registration and metadata assignment.
"""

from typing import Type, TypeVar

from dify_custom_nodes.base_node import BaseCustomNode

T = TypeVar("T", bound=BaseCustomNode)


def register_node(node_type: str, version: str = "1", **metadata) -> callable:
    """
    Decorator to register a custom node

    This decorator:
    1. Sets the node_type and version class variables
    2. Adds __custom_node_meta__ for automatic discovery
    3. Validates the node class implements required methods

    Args:
        node_type: Unique node type identifier (e.g., 'weather-api', 'database-query')
        version: Node version string (default: '1')
        **metadata: Additional metadata (author, description, etc.)

    Returns:
        Decorated class with registration metadata

    Example:
        >>> from dify_custom_nodes import BaseCustomNode, register_node
        >>>
        >>> @register_node('my-custom-node', version='1', author='John Doe')
        >>> class MyCustomNode(BaseCustomNode):
        ...     @classmethod
        ...     def get_schema(cls):
        ...         return {...}
        ...
        ...     @classmethod
        ...     def get_output_vars(cls, payload=None):
        ...         return [...]
        ...
        ...     def _run(self):
        ...         return {'status': 'succeeded', 'outputs': {...}}

    Raises:
        TypeError: If the decorated class doesn't inherit from BaseCustomNode
        NotImplementedError: If required methods are not implemented
    """

    def decorator(cls: Type[T]) -> Type[T]:
        # Validate class inherits from BaseCustomNode
        if not issubclass(cls, BaseCustomNode):
            raise TypeError(f"{cls.__name__} must inherit from BaseCustomNode")

        # Set node type and version
        cls.node_type = node_type
        cls.version = version

        # Add registration metadata for automatic discovery
        cls.__custom_node_meta__ = {
            "node_type": node_type,
            "version": version,
            "class": cls,
            **metadata,
        }

        # Validate required methods are implemented
        _validate_node_class(cls)

        return cls

    return decorator


def _validate_node_class(cls: Type[BaseCustomNode]) -> None:
    """
    Validate that a node class implements all required methods

    Args:
        cls: Node class to validate

    Raises:
        NotImplementedError: If required methods are missing
    """
    required_methods = ["get_schema", "get_output_vars", "_run"]

    for method_name in required_methods:
        if not hasattr(cls, method_name):
            raise NotImplementedError(f"{cls.__name__} must implement {method_name}()")

        method = getattr(cls, method_name)

        # Check if method is actually implemented (not just inherited abstract method)
        if hasattr(method, "__isabstractmethod__") and method.__isabstractmethod__:
            raise NotImplementedError(f"{cls.__name__}.{method_name}() is not implemented")
