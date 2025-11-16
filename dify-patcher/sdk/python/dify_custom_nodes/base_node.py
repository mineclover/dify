"""
Base class for custom workflow nodes

This module provides a simplified base class for developing custom nodes,
re-exporting and wrapping the core Dify Node class with a cleaner interface.
"""

from abc import ABC, abstractmethod
from typing import Any, ClassVar, Generator

from dify_custom_nodes.types import (
    NodeRunResult,
    NodeSchema,
    OutputVar,
    WorkflowNodeExecutionStatus,
)


class BaseCustomNode(ABC):
    """
    Simplified base class for custom workflow nodes

    This class provides a clean interface for custom node development,
    abstracting away the complexity of the core Dify Node class.

    Subclasses must implement:
    - get_schema(): Return JSON Schema for configuration UI
    - get_output_vars(): Define output variables
    - _run(): Execute the node logic

    Example:
        >>> @register_node('weather-api', version='1')
        >>> class WeatherNode(BaseCustomNode):
        ...
        ...     @classmethod
        ...     def get_schema(cls) -> NodeSchema:
        ...         return {
        ...             "type": "object",
        ...             "properties": {
        ...                 "city": {"type": "string", "title": "City"},
        ...                 "api_key": {"type": "string", "title": "API Key", "format": "password"}
        ...             },
        ...             "required": ["city", "api_key"]
        ...         }
        ...
        ...     @classmethod
        ...     def get_output_vars(cls) -> list[OutputVar]:
        ...         return [
        ...             {"variable": "temperature", "type": "number", "description": "Temperature in Celsius"},
        ...             {"variable": "description", "type": "string", "description": "Weather description"}
        ...         ]
        ...
        ...     def _run(self) -> NodeRunResult:
        ...         city = self.get_input('city')
        ...         api_key = self.get_input('api_key')
        ...
        ...         # Fetch weather data
        ...         weather_data = self._fetch_weather(city, api_key)
        ...
        ...         return {
        ...             'status': WorkflowNodeExecutionStatus.SUCCEEDED,
        ...             'inputs': {'city': city},
        ...             'outputs': {
        ...                 'temperature': weather_data['temp'],
        ...                 'description': weather_data['description']
        ...             }
        ...         }
    """

    # Class-level metadata (set by @register_node decorator)
    node_type: ClassVar[str]
    version: ClassVar[str] = "1"

    def __init__(
        self,
        id: str,
        config: dict[str, Any],
        graph_init_params: Any,
        graph_runtime_state: Any,
    ) -> None:
        """
        Initialize the custom node

        Args:
            id: Unique node instance ID
            config: Node configuration from workflow
            graph_init_params: Graph initialization parameters
            graph_runtime_state: Current graph runtime state (includes variable pool)
        """
        self.id = id
        self.config = config
        self.graph_init_params = graph_init_params
        self.graph_runtime_state = graph_runtime_state
        self._node_data: dict[str, Any] = {}

    def init_node_data(self, data: dict[str, Any]) -> None:
        """
        Initialize node data from configuration

        This is called automatically after __init__ with the 'data' field
        from the node configuration.

        Args:
            data: Node data dictionary from workflow configuration
        """
        self._node_data = data

    def get_input(self, key: str, default: Any = None) -> Any:
        """
        Get an input value from node configuration

        Args:
            key: Input field name
            default: Default value if not found

        Returns:
            Input value or default
        """
        return self._node_data.get(key, default)

    def get_variable(self, selector: str) -> Any:
        """
        Get a variable from the variable pool

        Args:
            selector: Variable selector (e.g., 'node_id.output_name')

        Returns:
            Variable value or None if not found
        """
        try:
            from core.workflow.entities.variable_pool import VariableSelector

            var_selector = VariableSelector.from_str(selector)
            variable = self.graph_runtime_state.variable_pool.get(var_selector.value_selector)
            return variable.to_object() if variable else None
        except Exception:
            return None

    @classmethod
    @abstractmethod
    def get_schema(cls) -> NodeSchema:
        """
        Get JSON Schema for node configuration UI

        This schema is used to automatically generate the configuration form
        in the Dify frontend.

        Returns:
            JSON Schema dictionary

        Example:
            {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "title": "API URL",
                        "format": "uri"
                    },
                    "method": {
                        "type": "string",
                        "title": "HTTP Method",
                        "enum": ["GET", "POST", "PUT", "DELETE"],
                        "default": "GET"
                    }
                },
                "required": ["url"]
            }
        """
        raise NotImplementedError

    @classmethod
    @abstractmethod
    def get_output_vars(cls, payload: dict[str, Any] | None = None) -> list[OutputVar]:
        """
        Define output variables produced by this node

        These variables can be used by subsequent nodes in the workflow.

        Args:
            payload: Current node configuration (for dynamic outputs)

        Returns:
            List of output variable definitions

        Example:
            [
                {
                    "variable": "status_code",
                    "type": VarType.NUMBER,
                    "description": "HTTP response status code"
                },
                {
                    "variable": "body",
                    "type": VarType.STRING,
                    "description": "Response body"
                }
            ]
        """
        raise NotImplementedError

    @abstractmethod
    def _run(self) -> NodeRunResult | Generator[Any, None, None]:
        """
        Execute the node logic

        This is the main entry point for node execution. Implement your
        business logic here.

        Returns:
            NodeRunResult with status and outputs, or Generator for streaming

        Example (simple):
            return {
                'status': WorkflowNodeExecutionStatus.SUCCEEDED,
                'inputs': {'url': url},
                'outputs': {'result': data}
            }

        Example (streaming):
            def _run(self):
                for chunk in process_streaming():
                    yield NodeEvent(...)
                yield NodeRunResult(...)
        """
        raise NotImplementedError

    def validate_inputs(self, inputs: dict[str, Any]) -> tuple[bool, str | None]:
        """
        Validate input values (optional override)

        Override this method to add custom validation logic beyond JSON Schema.

        Args:
            inputs: Input values to validate

        Returns:
            (is_valid, error_message)

        Example:
            def validate_inputs(self, inputs):
                if inputs.get('timeout', 0) > 300:
                    return False, "Timeout cannot exceed 300 seconds"
                return True, None
        """
        return True, None

    @classmethod
    def get_title(cls) -> str:
        """
        Get node title for UI (optional override)

        Returns:
            Node title string
        """
        return cls.node_type.replace("-", " ").title()

    @classmethod
    def get_description(cls) -> str | None:
        """
        Get node description for UI (optional override)

        Returns:
            Node description string or None
        """
        return None
