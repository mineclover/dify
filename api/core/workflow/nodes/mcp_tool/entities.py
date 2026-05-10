"""
MCP Tool Node Entities

Data models for MCP tool nodes.
"""

from typing import Any

from pydantic import BaseModel

from core.workflow.nodes.base.entities import BaseNodeData


class MCPToolNodeData(BaseNodeData):
    """
    Data model for MCP Tool Node.

    This stores the configuration for a specific MCP tool invocation.
    """

    # MCP provider identifier
    provider_id: str

    # MCP tool name
    tool_name: str

    # Tool parameters (key-value pairs)
    # Values can be constants or variable references
    tool_parameters: dict[str, Any] = {}

    # MCP server connection settings (optional overrides)
    timeout: float | None = None
    sse_read_timeout: float | None = None


class MCPToolInfo(BaseModel):
    """
    Information about an MCP tool for node generation.
    """

    # Provider info
    provider_id: str
    provider_name: str
    server_url: str

    # Tool info
    tool_name: str
    tool_description: str | None = None

    # JSON Schema for input parameters
    input_schema: dict[str, Any]

    # JSON Schema for output (optional)
    output_schema: dict[str, Any] | None = None

    # Generated node type string
    @property
    def node_type(self) -> str:
        """Generate node type string for this MCP tool."""
        # Format: mcp-{provider_id}-{tool_name}
        safe_tool_name = self.tool_name.replace("_", "-").replace(" ", "-").lower()
        return f"mcp-{self.provider_id[:8]}-{safe_tool_name}"
