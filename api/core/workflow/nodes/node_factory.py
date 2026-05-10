from typing import TYPE_CHECKING, final

from typing_extensions import override

from core.workflow.enums import NodeType
from core.workflow.graph import NodeFactory
from core.workflow.nodes.base.node import Node
from libs.typing import is_str, is_str_dict

from .node_mapping import (
    LATEST_VERSION,
    NODE_TYPE_CLASSES_MAPPING,
    get_node_class,
)

if TYPE_CHECKING:
    from core.workflow.entities import GraphInitParams
    from core.workflow.runtime import GraphRuntimeState


@final
class DifyNodeFactory(NodeFactory):
    """
    Default implementation of NodeFactory that uses the traditional node mapping.

    This factory creates nodes by looking up their types in NODE_TYPE_CLASSES_MAPPING
    and instantiating the appropriate node class.

    Enhanced with dify-patcher to support:
    - Custom nodes from _custom directory
    - MCP tool nodes (mcp-* prefixed types)
    """

    def __init__(
        self,
        graph_init_params: "GraphInitParams",
        graph_runtime_state: "GraphRuntimeState",
    ) -> None:
        self.graph_init_params = graph_init_params
        self.graph_runtime_state = graph_runtime_state

    @override
    def create_node(self, node_config: dict[str, object]) -> Node:
        """
        Create a Node instance from node configuration data.

        Supports both built-in nodes (via NodeType enum) and custom nodes
        (via string type from dify-patcher).

        :param node_config: node configuration dictionary containing type and other data
        :return: initialized Node instance
        :raises ValueError: if node type is unknown or configuration is invalid
        """
        # Get node_id from config
        node_id = node_config.get("id")
        if not is_str(node_id):
            raise ValueError("Node config missing id")

        # Get node type from config
        node_data = node_config.get("data", {})
        if not is_str_dict(node_data):
            raise ValueError(f"Node {node_id} missing data information")

        node_type_str = node_data.get("type")
        if not is_str(node_type_str):
            raise ValueError(f"Node {node_id} missing or invalid type information")

        # Try to get node class - supports both built-in and custom nodes
        node_class = self._get_node_class(node_type_str)

        if not node_class:
            raise ValueError(f"Unknown node type: {node_type_str}")

        # Create node instance
        return node_class(
            id=node_id,
            config=node_config,
            graph_init_params=self.graph_init_params,
            graph_runtime_state=self.graph_runtime_state,
        )

    def _get_node_class(self, node_type_str: str) -> type[Node] | None:
        """
        Get node class by type string.

        Supports:
        1. Built-in nodes (NodeType enum)
        2. Custom nodes (dify-patcher)
        3. MCP tool nodes (mcp-* prefix)

        Args:
            node_type_str: The node type string

        Returns:
            Node class or None if not found
        """
        # Try built-in node type first
        try:
            node_type = NodeType(node_type_str)
            node_mapping = NODE_TYPE_CLASSES_MAPPING.get(node_type)
            if node_mapping:
                return node_mapping.get(LATEST_VERSION)
        except ValueError:
            pass

        # Try custom node or MCP node via unified getter
        return get_node_class(node_type_str, LATEST_VERSION)
