"""
Agno Agent Node

Execute Agno AgentOS agents in Dify workflows with full support for
sessions, streaming, and authentication.
"""

import time
import uuid
from typing import Any
from urllib.parse import urljoin

import requests

from dify_custom_nodes import BaseCustomNode, NodeRunResult, WorkflowNodeExecutionStatus, register_node
from dify_custom_nodes.types import VarType


@register_node("agno-agent", version="1")
class AgnoAgentNode(BaseCustomNode):
    """
    Agno Agent Integration Node

    Connects to Agno AgentOS to execute agents with full support for:
    - Bearer token authentication
    - Session management
    - Streaming responses (SSE)
    - File attachments
    - Error handling and timeouts
    """

    @classmethod
    def get_schema(cls) -> dict[str, Any]:
        """Define configuration schema"""
        return {
            "type": "object",
            "properties": {
                "agno_base_url": {
                    "type": "string",
                    "title": "Agno Base URL",
                    "description": "Base URL of your Agno AgentOS instance (e.g., https://your-agno.com)",
                    "format": "uri",
                },
                "agent_id": {
                    "type": "string",
                    "title": "Agent ID",
                    "description": "Identifier of the agent to execute",
                    "minLength": 1,
                },
                "api_key": {
                    "type": "string",
                    "title": "API Key",
                    "description": "Bearer token for authentication (AgentOS Security Key)",
                    "format": "password",
                },
                "message": {
                    "type": "string",
                    "title": "Message",
                    "description": "Message to send to the agent",
                    "minLength": 1,
                },
                "session_id": {
                    "type": "string",
                    "title": "Session ID",
                    "description": "Session identifier for conversation context (auto-generated if not provided)",
                },
                "user_id": {
                    "type": "string",
                    "title": "User ID",
                    "description": "User identifier for tracking",
                },
                "stream": {
                    "type": "boolean",
                    "title": "Enable Streaming",
                    "description": "Enable Server-Sent Events streaming",
                    "default": False,
                },
                "timeout": {
                    "type": "number",
                    "title": "Timeout (seconds)",
                    "description": "Request timeout in seconds",
                    "default": 60,
                    "minimum": 1,
                    "maximum": 300,
                },
            },
            "required": ["agno_base_url", "agent_id", "api_key", "message"],
        }

    @classmethod
    def get_output_vars(cls, payload: dict[str, Any] | None = None) -> list:
        """Define output variables"""
        return [
            {"variable": "response", "type": VarType.String, "description": "Agent response text"},
            {"variable": "run_id", "type": VarType.String, "description": "Agno run identifier"},
            {"variable": "session_id", "type": VarType.String, "description": "Session ID used for this run"},
            {"variable": "status", "type": VarType.String, "description": "Execution status (success, failed, timeout)"},
            {"variable": "execution_time", "type": VarType.Number, "description": "Execution time in milliseconds"},
            {"variable": "error_message", "type": VarType.String, "description": "Error message if failed"},
        ]

    def _run(self) -> NodeRunResult:
        """Execute Agno agent"""
        start_time = time.time()

        # Get inputs
        agno_base_url = self.get_input("agno_base_url", "").rstrip("/")
        agent_id = self.get_input("agent_id", "")
        api_key = self.get_input("api_key", "")
        message = self.get_input("message", "")
        session_id = self.get_input("session_id") or str(uuid.uuid4())
        user_id = self.get_input("user_id")
        stream = self.get_input("stream", False)
        timeout = self.get_input("timeout", 60)

        # Validate required inputs
        if not agno_base_url:
            return self._error_result("Agno Base URL is required", start_time)

        if not agent_id:
            return self._error_result("Agent ID is required", start_time)

        if not api_key:
            return self._error_result("API Key is required", start_time)

        if not message:
            return self._error_result("Message is required", start_time)

        try:
            # Build endpoint URL
            endpoint = urljoin(agno_base_url, f"/agents/{agent_id}/runs")

            # Prepare headers
            headers = {"Authorization": f"Bearer {api_key}"}

            # Prepare form data (multipart/form-data)
            data = {
                "message": message,
                "stream": str(stream).lower(),  # Convert to 'true' or 'false'
            }

            if session_id:
                data["session_id"] = session_id

            if user_id:
                data["user_id"] = user_id

            # Make request
            response = requests.post(endpoint, headers=headers, data=data, timeout=timeout, stream=stream)

            # Check HTTP status
            if response.status_code == 401:
                return self._error_result("Authentication failed. Check your API key.", start_time)
            elif response.status_code == 404:
                return self._error_result(f"Agent '{agent_id}' not found.", start_time)
            elif response.status_code == 422:
                error_detail = response.json().get("detail", "Validation error")
                return self._error_result(f"Validation error: {error_detail}", start_time)
            elif response.status_code >= 500:
                return self._error_result("Agno server error. Please try again later.", start_time)
            elif response.status_code != 200:
                return self._error_result(f"Unexpected error (HTTP {response.status_code})", start_time)

            # Parse response
            if stream:
                # Handle SSE streaming response
                agent_response, run_id = self._handle_streaming_response(response)
            else:
                # Handle JSON response
                result = response.json()
                agent_response = result.get("content", "")
                run_id = result.get("run_id", "")

            execution_time = int((time.time() - start_time) * 1000)

            return {
                "status": WorkflowNodeExecutionStatus.SUCCEEDED,
                "inputs": {
                    "agno_base_url": agno_base_url,
                    "agent_id": agent_id,
                    "message": message,
                    "session_id": session_id,
                },
                "outputs": {
                    "response": agent_response,
                    "run_id": run_id,
                    "session_id": session_id,
                    "status": "success",
                    "execution_time": execution_time,
                    "error_message": "",
                },
            }

        except requests.exceptions.Timeout:
            return self._error_result(f"Request timed out after {timeout} seconds", start_time)

        except requests.exceptions.ConnectionError:
            return self._error_result(f"Failed to connect to {agno_base_url}. Check the URL and network.", start_time)

        except requests.exceptions.RequestException as e:
            return self._error_result(f"Request failed: {str(e)}", start_time)

        except Exception as e:
            return self._error_result(f"Unexpected error: {str(e)}", start_time)

    def _handle_streaming_response(self, response: requests.Response) -> tuple[str, str]:
        """
        Handle Server-Sent Events (SSE) streaming response

        Args:
            response: Streaming response object

        Returns:
            Tuple of (complete_response, run_id)
        """
        complete_response = []
        run_id = ""

        try:
            for line in response.iter_lines():
                if not line:
                    continue

                line = line.decode("utf-8")

                # SSE format: "data: {...}"
                if line.startswith("data: "):
                    data_str = line[6:]  # Remove "data: " prefix

                    # Skip heartbeat/keep-alive messages
                    if data_str.strip() == "[DONE]" or not data_str.strip():
                        continue

                    # Parse JSON
                    try:
                        import json

                        data = json.loads(data_str)

                        # Extract content
                        if "content" in data:
                            complete_response.append(data["content"])

                        # Extract run_id
                        if "run_id" in data and not run_id:
                            run_id = data["run_id"]

                    except json.JSONDecodeError:
                        # Skip invalid JSON
                        continue

        except Exception:
            # If streaming fails, return what we have so far
            pass

        return "".join(complete_response), run_id

    def _error_result(self, error_message: str, start_time: float) -> NodeRunResult:
        """
        Create error result

        Args:
            error_message: Error description
            start_time: Execution start time

        Returns:
            NodeRunResult with error
        """
        execution_time = int((time.time() - start_time) * 1000)

        return {
            "status": WorkflowNodeExecutionStatus.FAILED,
            "inputs": {},
            "outputs": {
                "response": "",
                "run_id": "",
                "session_id": "",
                "status": "failed",
                "execution_time": execution_time,
                "error_message": error_message,
            },
        }

    @classmethod
    def get_title(cls) -> str:
        return "Agno Agent"

    @classmethod
    def get_description(cls) -> str:
        return "Execute Agno AgentOS agents with session management and streaming support"
