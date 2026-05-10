"""
MCP Tool Node

A workflow node that wraps a single MCP tool for direct execution.
"""

import logging
from collections.abc import Generator, Mapping, Sequence
from typing import Any, ClassVar

from core.mcp.error import MCPConnectionError
from core.mcp.mcp_client import MCPClient
from core.mcp.types import AudioContent, ImageContent, TextContent
from core.workflow.enums import WorkflowNodeExecutionStatus
from core.workflow.node_events import NodeEventBase, NodeRunResult
from core.workflow.nodes.base.node import Node

from .entities import MCPToolInfo, MCPToolNodeData

logger = logging.getLogger(__name__)


class MCPToolNode(Node[MCPToolNodeData]):
    """
    Workflow node that directly invokes an MCP tool.

    Unlike the standard Tool Node which relies on AI to select tools,
    this node directly calls a specific MCP tool with configured parameters.
    """

    # Will be set dynamically for each tool instance
    node_type: ClassVar[str] = "mcp-tool"

    # Tool metadata (set by factory)
    _tool_info: ClassVar[MCPToolInfo | None] = None

    @classmethod
    def version(cls) -> str:
        return "1"

    def _run(self) -> NodeRunResult | Generator[NodeEventBase, None, None]:
        """Execute the MCP tool."""
        # Get connection parameters
        provider_id = self.node_data.provider_id
        tool_name = self.node_data.tool_name

        # Resolve tool parameters from variable pool
        parameters = self._resolve_parameters()

        # Get server URL from provider
        server_url, headers, timeout, sse_read_timeout = self._get_connection_info()

        if not server_url:
            return NodeRunResult(
                status=WorkflowNodeExecutionStatus.FAILED,
                inputs=parameters,
                outputs={},
                error=f"MCP provider '{provider_id}' not found or not configured",
            )

        try:
            # Invoke the MCP tool
            with MCPClient(
                server_url=server_url,
                headers=headers,
                timeout=timeout or self.node_data.timeout or 30.0,
                sse_read_timeout=sse_read_timeout or self.node_data.sse_read_timeout or 300.0,
            ) as client:
                result = client.invoke_tool(tool_name, parameters)

            # Process the result
            outputs = self._process_result(result)

            if result.isError:
                return NodeRunResult(
                    status=WorkflowNodeExecutionStatus.FAILED,
                    inputs=parameters,
                    outputs=outputs,
                    error=outputs.get("text", "MCP tool execution failed"),
                )

            return NodeRunResult(
                status=WorkflowNodeExecutionStatus.SUCCEEDED,
                inputs=parameters,
                outputs=outputs,
            )

        except MCPConnectionError as e:
            logger.warning("MCP connection error for %s/%s: %s", provider_id, tool_name, e)
            return NodeRunResult(
                status=WorkflowNodeExecutionStatus.FAILED,
                inputs=parameters,
                outputs={},
                error=f"Failed to connect to MCP server: {e}",
            )
        except Exception as e:
            logger.exception("MCP tool execution error for %s/%s", provider_id, tool_name)
            return NodeRunResult(
                status=WorkflowNodeExecutionStatus.FAILED,
                inputs=parameters,
                outputs={},
                error=f"MCP tool execution failed: {e}",
            )

    def _resolve_parameters(self) -> dict[str, Any]:
        """
        Resolve tool parameters, substituting variable references.
        """
        resolved = {}
        for key, value in self.node_data.tool_parameters.items():
            if isinstance(value, dict) and value.get("type") == "variable":
                # Variable reference
                selector = value.get("value", [])
                if selector:
                    var = self.graph_runtime_state.variable_pool.get(selector)
                    resolved[key] = var.value if var else None
            elif isinstance(value, dict) and value.get("type") == "mixed":
                # Template string with variable substitution
                template = str(value.get("value", ""))
                segment_group = self.graph_runtime_state.variable_pool.convert_template(template)
                resolved[key] = segment_group.text
            else:
                # Constant value
                resolved[key] = value

        return resolved

    def _get_connection_info(self) -> tuple[str | None, dict[str, str], float | None, float | None]:
        """
        Get MCP server connection information from the provider.

        Returns:
            (server_url, headers, timeout, sse_read_timeout)
        """
        from sqlalchemy.orm import Session

        from extensions.ext_database import db
        from models.tools import MCPToolProvider

        provider_id = self.node_data.provider_id

        with Session(db.engine) as session:
            provider = session.query(MCPToolProvider).filter(
                MCPToolProvider.id == provider_id,
                MCPToolProvider.tenant_id == self.tenant_id,
            ).first()

            if not provider:
                return None, {}, None, None

            # Decrypt server URL and headers
            try:
                server_url = provider.decrypt_server_url()
                headers = provider.decrypt_headers() or {}
            except Exception as e:
                logger.warning("Failed to decrypt MCP provider credentials: %s", e)
                return None, {}, None, None

            return server_url, headers, provider.timeout, provider.sse_read_timeout

    def _process_result(self, result) -> dict[str, Any]:
        """
        Process MCP CallToolResult into node outputs.
        """
        outputs: dict[str, Any] = {}
        text_parts = []
        images = []
        audio_files = []

        for content in result.content:
            if isinstance(content, TextContent):
                text_parts.append(content.text)
            elif isinstance(content, ImageContent):
                images.append({
                    "data": content.data,
                    "mime_type": content.mimeType,
                })
            elif isinstance(content, AudioContent):
                audio_files.append({
                    "data": content.data,
                    "mime_type": content.mimeType,
                })

        # Standard outputs
        outputs["text"] = "\n".join(text_parts) if text_parts else ""

        if images:
            outputs["images"] = images
        if audio_files:
            outputs["audio"] = audio_files

        # Structured content (if available)
        if result.structuredContent:
            outputs["structured"] = result.structuredContent
            # Also spread structured content as individual outputs
            for key, value in result.structuredContent.items():
                if key not in outputs:
                    outputs[key] = value

        return outputs

    @classmethod
    def _extract_variable_selector_to_variable_mapping(
        cls,
        *,
        graph_config: Mapping[str, Any],
        node_id: str,
        node_data: Mapping[str, Any],
    ) -> Mapping[str, Sequence[str]]:
        """Extract variable references from tool parameters."""
        result = {}
        tool_parameters = node_data.get("tool_parameters", {})

        for param_name, param_value in tool_parameters.items():
            if isinstance(param_value, dict):
                if param_value.get("type") == "variable":
                    selector = param_value.get("value", [])
                    if selector:
                        result[f"{node_id}.{param_name}"] = selector

        return result


def create_mcp_tool_node_class(tool_info: MCPToolInfo) -> type[MCPToolNode]:
    """
    Factory function to create a specific MCP tool node class.

    Args:
        tool_info: Information about the MCP tool

    Returns:
        A new MCPToolNode subclass configured for this specific tool
    """
    class_name = f"MCPToolNode_{tool_info.tool_name.replace('-', '_').replace(' ', '_')}"

    # Create a new class dynamically
    node_class = type(
        class_name,
        (MCPToolNode,),
        {
            "node_type": tool_info.node_type,
            "_tool_info": tool_info,
        }
    )

    return node_class
