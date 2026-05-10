"""
MCP Node Registry

Handles dynamic registration of MCP tools as workflow nodes.
"""

import json
import logging
from typing import Any

from core.workflow.nodes.base.node import Node

from .entities import MCPToolInfo
from .node import MCPToolNode, create_mcp_tool_node_class

logger = logging.getLogger(__name__)

# Global registry for MCP nodes
# Format: {node_type: {version: node_class}}
_MCP_NODE_REGISTRY: dict[str, dict[str, type[MCPToolNode]]] = {}

# Cache of tool info by node type
_MCP_TOOL_INFO_CACHE: dict[str, MCPToolInfo] = {}


def get_mcp_node_registry() -> dict[str, dict[str, type[MCPToolNode]]]:
    """Get the global MCP node registry."""
    return _MCP_NODE_REGISTRY


def get_mcp_tool_info(node_type: str) -> MCPToolInfo | None:
    """Get tool info for a node type."""
    return _MCP_TOOL_INFO_CACHE.get(node_type)


def load_mcp_nodes(tenant_id: str | None = None) -> dict[str, dict[str, type[Node]]]:
    """
    Load MCP tools as workflow nodes from the database.

    Args:
        tenant_id: Optional tenant ID to filter providers.
                   If None, loads all providers (for global registration).

    Returns:
        Dict mapping node_type -> {version -> node_class}
    """
    from sqlalchemy.orm import Session

    from extensions.ext_database import db
    from models.tools import MCPToolProvider

    try:
        with Session(db.engine) as session:
            query = session.query(MCPToolProvider)
            if tenant_id:
                query = query.filter(MCPToolProvider.tenant_id == tenant_id)

            providers = query.all()

            for provider in providers:
                _register_provider_tools(provider)

    except Exception as e:
        logger.warning("[mcp-node] Failed to load MCP nodes from database: %s", e)

    logger.info("[mcp-node] Loaded %d MCP tool node(s)", len(_MCP_NODE_REGISTRY))
    return _MCP_NODE_REGISTRY


def _register_provider_tools(provider) -> None:
    """
    Register all tools from an MCP provider as nodes.
    """
    try:
        tools_json = provider.tools
        if isinstance(tools_json, str):
            tools = json.loads(tools_json)
        else:
            tools = tools_json

        if not tools:
            return

        for tool_data in tools:
            try:
                tool_info = MCPToolInfo(
                    provider_id=provider.id,
                    provider_name=provider.name,
                    server_url=provider.server_url,  # Will be decrypted at runtime
                    tool_name=tool_data.get("name", ""),
                    tool_description=tool_data.get("description"),
                    input_schema=tool_data.get("inputSchema", {}),
                    output_schema=tool_data.get("outputSchema"),
                )

                _register_tool_node(tool_info)

            except Exception as e:
                logger.warning(
                    "[mcp-node] Failed to register tool %s from provider %s: %s",
                    tool_data.get("name", "unknown"),
                    provider.name,
                    e
                )

    except json.JSONDecodeError as e:
        logger.warning("[mcp-node] Failed to parse tools JSON for provider %s: %s", provider.name, e)
    except Exception as e:
        logger.warning("[mcp-node] Failed to register tools for provider %s: %s", provider.name, e)


def _register_tool_node(tool_info: MCPToolInfo) -> None:
    """
    Register a single MCP tool as a workflow node.
    """
    node_type = tool_info.node_type

    # Check for conflicts
    if node_type in _MCP_NODE_REGISTRY:
        logger.debug("[mcp-node] Node type %s already registered, skipping", node_type)
        return

    # Create the node class
    node_class = create_mcp_tool_node_class(tool_info)

    # Register in global registry
    _MCP_NODE_REGISTRY[node_type] = {
        "latest": node_class,
        "1": node_class,
    }

    # Cache tool info
    _MCP_TOOL_INFO_CACHE[node_type] = tool_info

    logger.debug("[mcp-node] Registered MCP tool node: %s", node_type)


def get_mcp_node_class(node_type: str, version: str = "latest") -> type[MCPToolNode] | None:
    """
    Get an MCP node class by type and version.

    Args:
        node_type: The node type string (e.g., "mcp-abc123-list_files")
        version: Version string or "latest"

    Returns:
        Node class or None if not found
    """
    versions = _MCP_NODE_REGISTRY.get(node_type)
    if versions:
        return versions.get(version)
    return None


def is_mcp_node_type(node_type: str) -> bool:
    """
    Check if a node type is a registered MCP node.

    Args:
        node_type: The node type string

    Returns:
        True if it's an MCP node type
    """
    return node_type in _MCP_NODE_REGISTRY or node_type.startswith("mcp-")


def register_mcp_tool_node(
    provider_id: str,
    provider_name: str,
    server_url: str,
    tool_name: str,
    input_schema: dict[str, Any],
    tool_description: str | None = None,
    output_schema: dict[str, Any] | None = None,
) -> str:
    """
    Manually register an MCP tool as a workflow node.

    This can be used for runtime registration without database lookup.

    Args:
        provider_id: MCP provider ID
        provider_name: Human-readable provider name
        server_url: MCP server URL
        tool_name: Tool name from MCP
        input_schema: JSON Schema for tool parameters
        tool_description: Optional tool description
        output_schema: Optional JSON Schema for outputs

    Returns:
        The generated node_type string
    """
    tool_info = MCPToolInfo(
        provider_id=provider_id,
        provider_name=provider_name,
        server_url=server_url,
        tool_name=tool_name,
        tool_description=tool_description,
        input_schema=input_schema,
        output_schema=output_schema,
    )

    _register_tool_node(tool_info)

    return tool_info.node_type


def unregister_mcp_tool_node(node_type: str) -> bool:
    """
    Unregister an MCP tool node.

    Args:
        node_type: The node type to unregister

    Returns:
        True if successfully unregistered
    """
    if node_type in _MCP_NODE_REGISTRY:
        del _MCP_NODE_REGISTRY[node_type]
        if node_type in _MCP_TOOL_INFO_CACHE:
            del _MCP_TOOL_INFO_CACHE[node_type]
        return True
    return False


def refresh_mcp_nodes(tenant_id: str | None = None) -> None:
    """
    Refresh the MCP node registry from the database.

    This clears existing registrations and reloads from DB.
    """
    global _MCP_NODE_REGISTRY, _MCP_TOOL_INFO_CACHE
    _MCP_NODE_REGISTRY.clear()
    _MCP_TOOL_INFO_CACHE.clear()
    load_mcp_nodes(tenant_id)
