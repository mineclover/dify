"""
Test Node Node

TODO: Add description
"""

from typing import Any

from dify_custom_nodes import BaseCustomNode, register_node, NodeRunResult
from dify_custom_nodes.types import VarType, WorkflowNodeExecutionStatus


@register_node('test-node', version='1', author='Your Name')
class TestNodeNode(BaseCustomNode):
    """
    Test Node

    TODO: Add detailed description
    """

    @classmethod
    def get_schema(cls):
        """Define configuration schema"""
        return {
            "type": "object",
            "properties": {
                "input_text": {
                    "type": "string",
                    "title": "Input Text",
                    "description": "Sample input field",
                    "minLength": 1
                }
            },
            "required": ["input_text"]
        }

    @classmethod
    def get_output_vars(cls, payload=None):
        """Define output variables"""
        return [
            {
                "variable": "output_text",
                "type": VarType.STRING,
                "description": "Sample output field"
            }
        ]

    def _run(self) -> NodeRunResult:
        """Execute node logic"""
        # Get inputs
        input_text = self.get_input('input_text', '')

        # TODO: Implement your logic here
        output_text = f"Processed: {input_text}"

        return {
            'status': WorkflowNodeExecutionStatus.SUCCEEDED,
            'inputs': {'input_text': input_text},
            'outputs': {
                'output_text': output_text
            }
        }
