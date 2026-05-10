import logging
from collections.abc import Mapping
from typing import Union

from core.workflow.enums import NodeType
from core.workflow.nodes.agent.agent_node import AgentNode
from core.workflow.nodes.answer.answer_node import AnswerNode
from core.workflow.nodes.base.node import Node
from core.workflow.nodes.code import CodeNode
from core.workflow.nodes.datasource.datasource_node import DatasourceNode
from core.workflow.nodes.document_extractor import DocumentExtractorNode
from core.workflow.nodes.end.end_node import EndNode
from core.workflow.nodes.http_request import HttpRequestNode
from core.workflow.nodes.human_input import HumanInputNode
from core.workflow.nodes.if_else import IfElseNode
from core.workflow.nodes.iteration import IterationNode, IterationStartNode
from core.workflow.nodes.knowledge_index import KnowledgeIndexNode
from core.workflow.nodes.knowledge_retrieval import KnowledgeRetrievalNode
from core.workflow.nodes.list_operator import ListOperatorNode
from core.workflow.nodes.llm import LLMNode
from core.workflow.nodes.loop import LoopEndNode, LoopNode, LoopStartNode
from core.workflow.nodes.parameter_extractor import ParameterExtractorNode
from core.workflow.nodes.question_classifier import QuestionClassifierNode
from core.workflow.nodes.start import StartNode
from core.workflow.nodes.template_transform import TemplateTransformNode
from core.workflow.nodes.tool import ToolNode
from core.workflow.nodes.trigger_plugin import TriggerEventNode
from core.workflow.nodes.trigger_schedule import TriggerScheduleNode
from core.workflow.nodes.trigger_webhook import TriggerWebhookNode
from core.workflow.nodes.variable_aggregator import VariableAggregatorNode
from core.workflow.nodes.variable_assigner.v1 import VariableAssignerNode as VariableAssignerNodeV1
from core.workflow.nodes.variable_assigner.v2 import VariableAssignerNode as VariableAssignerNodeV2

LATEST_VERSION = "latest"

# NOTE(QuantumGhost): This should be in sync with subclasses of BaseNode.
# Specifically, if you have introduced new node types, you should add them here.
#
# TODO(QuantumGhost): This could be automated with either metaclass or `__init_subclass__`
# hook. Try to avoid duplication of node information.
NODE_TYPE_CLASSES_MAPPING: Mapping[NodeType, Mapping[str, type[Node]]] = {
    NodeType.START: {
        LATEST_VERSION: StartNode,
        "1": StartNode,
    },
    NodeType.END: {
        LATEST_VERSION: EndNode,
        "1": EndNode,
    },
    NodeType.ANSWER: {
        LATEST_VERSION: AnswerNode,
        "1": AnswerNode,
    },
    NodeType.LLM: {
        LATEST_VERSION: LLMNode,
        "1": LLMNode,
    },
    NodeType.KNOWLEDGE_RETRIEVAL: {
        LATEST_VERSION: KnowledgeRetrievalNode,
        "1": KnowledgeRetrievalNode,
    },
    NodeType.IF_ELSE: {
        LATEST_VERSION: IfElseNode,
        "1": IfElseNode,
    },
    NodeType.CODE: {
        LATEST_VERSION: CodeNode,
        "1": CodeNode,
    },
    NodeType.TEMPLATE_TRANSFORM: {
        LATEST_VERSION: TemplateTransformNode,
        "1": TemplateTransformNode,
    },
    NodeType.QUESTION_CLASSIFIER: {
        LATEST_VERSION: QuestionClassifierNode,
        "1": QuestionClassifierNode,
    },
    NodeType.HTTP_REQUEST: {
        LATEST_VERSION: HttpRequestNode,
        "1": HttpRequestNode,
    },
    NodeType.TOOL: {
        LATEST_VERSION: ToolNode,
        # This is an issue that caused problems before.
        # Logically, we shouldn't use two different versions to point to the same class here,
        # but in order to maintain compatibility with historical data, this approach has been retained.
        "2": ToolNode,
        "1": ToolNode,
    },
    NodeType.VARIABLE_AGGREGATOR: {
        LATEST_VERSION: VariableAggregatorNode,
        "1": VariableAggregatorNode,
    },
    NodeType.LEGACY_VARIABLE_AGGREGATOR: {
        LATEST_VERSION: VariableAggregatorNode,
        "1": VariableAggregatorNode,
    },  # original name of VARIABLE_AGGREGATOR
    NodeType.ITERATION: {
        LATEST_VERSION: IterationNode,
        "1": IterationNode,
    },
    NodeType.ITERATION_START: {
        LATEST_VERSION: IterationStartNode,
        "1": IterationStartNode,
    },
    NodeType.LOOP: {
        LATEST_VERSION: LoopNode,
        "1": LoopNode,
    },
    NodeType.LOOP_START: {
        LATEST_VERSION: LoopStartNode,
        "1": LoopStartNode,
    },
    NodeType.LOOP_END: {
        LATEST_VERSION: LoopEndNode,
        "1": LoopEndNode,
    },
    NodeType.PARAMETER_EXTRACTOR: {
        LATEST_VERSION: ParameterExtractorNode,
        "1": ParameterExtractorNode,
    },
    NodeType.VARIABLE_ASSIGNER: {
        LATEST_VERSION: VariableAssignerNodeV2,
        "1": VariableAssignerNodeV1,
        "2": VariableAssignerNodeV2,
    },
    NodeType.DOCUMENT_EXTRACTOR: {
        LATEST_VERSION: DocumentExtractorNode,
        "1": DocumentExtractorNode,
    },
    NodeType.LIST_OPERATOR: {
        LATEST_VERSION: ListOperatorNode,
        "1": ListOperatorNode,
    },
    NodeType.AGENT: {
        LATEST_VERSION: AgentNode,
        # This is an issue that caused problems before.
        # Logically, we shouldn't use two different versions to point to the same class here,
        # but in order to maintain compatibility with historical data, this approach has been retained.
        "2": AgentNode,
        "1": AgentNode,
    },
    NodeType.HUMAN_INPUT: {
        LATEST_VERSION: HumanInputNode,
        "1": HumanInputNode,
    },
    NodeType.DATASOURCE: {
        LATEST_VERSION: DatasourceNode,
        "1": DatasourceNode,
    },
    NodeType.KNOWLEDGE_INDEX: {
        LATEST_VERSION: KnowledgeIndexNode,
        "1": KnowledgeIndexNode,
    },
    NodeType.TRIGGER_WEBHOOK: {
        LATEST_VERSION: TriggerWebhookNode,
        "1": TriggerWebhookNode,
    },
    NodeType.TRIGGER_PLUGIN: {
        LATEST_VERSION: TriggerEventNode,
        "1": TriggerEventNode,
    },
    NodeType.TRIGGER_SCHEDULE: {
        LATEST_VERSION: TriggerScheduleNode,
        "1": TriggerScheduleNode,
    },
}

logger = logging.getLogger(__name__)

# ============================================================
# Custom Nodes Integration (dify-patcher)
# ============================================================
# Custom nodes are loaded dynamically from _custom directory
# and merged into the node mapping at runtime.

# Combined mapping type that supports both NodeType enum and string keys
NodeTypeKey = Union[NodeType, str]
COMBINED_NODE_MAPPING: dict[NodeTypeKey, Mapping[str, type[Node]]] = dict(NODE_TYPE_CLASSES_MAPPING)


def _load_custom_nodes_into_mapping() -> None:
    """
    Load custom nodes and add them to the combined mapping.

    This function is called once at module import time.
    """
    try:
        from core.dify_custom_nodes.loader import load_custom_nodes

        custom_registry = load_custom_nodes()

        for node_type, versions in custom_registry.items():
            if node_type in COMBINED_NODE_MAPPING:
                logger.warning("[dify-patcher] Custom node type '%s' conflicts with built-in node", node_type)
                continue

            COMBINED_NODE_MAPPING[node_type] = versions
            logger.debug("[dify-patcher] Registered custom node: %s", node_type)

    except ImportError as e:
        logger.debug("[dify-patcher] Custom nodes not available: %s", e)
    except Exception as e:
        logger.warning("[dify-patcher] Failed to load custom nodes: %s", e)


def _load_mcp_nodes_into_mapping() -> None:
    """
    Load MCP tool nodes and add them to the combined mapping.

    MCP tools are loaded from the database and converted to workflow nodes.
    This allows direct use of MCP tools in workflows without AI orchestration.
    """
    try:
        from core.workflow.nodes.mcp_tool.registry import get_mcp_node_registry, load_mcp_nodes

        # Load MCP nodes (no tenant filter for global registration)
        load_mcp_nodes()
        mcp_registry = get_mcp_node_registry()

        for node_type, versions in mcp_registry.items():
            if node_type in COMBINED_NODE_MAPPING:
                logger.warning("[mcp-node] MCP node type '%s' conflicts with existing node", node_type)
                continue

            COMBINED_NODE_MAPPING[node_type] = versions
            logger.debug("[mcp-node] Registered MCP tool node: %s", node_type)

    except ImportError as e:
        logger.debug("[mcp-node] MCP nodes not available: %s", e)
    except Exception as e:
        logger.warning("[mcp-node] Failed to load MCP nodes: %s", e)


def get_node_class(node_type: NodeTypeKey, version: str = LATEST_VERSION) -> type[Node] | None:
    """
    Get a node class by type and version.

    This function checks built-in, custom, and MCP nodes.

    Args:
        node_type: NodeType enum or string for custom/MCP nodes
        version: Version string or "latest"

    Returns:
        Node class or None if not found
    """
    versions = COMBINED_NODE_MAPPING.get(node_type)
    if versions:
        return versions.get(version)

    # Check MCP nodes (may be registered after initial load)
    if isinstance(node_type, str) and node_type.startswith("mcp-"):
        try:
            from core.workflow.nodes.mcp_tool.registry import get_mcp_node_class
            return get_mcp_node_class(node_type, version)
        except ImportError:
            pass

    return None


def is_valid_node_type(node_type: str) -> bool:
    """
    Check if a node type string is valid (built-in, custom, or MCP).

    Args:
        node_type: The node type string

    Returns:
        True if valid
    """
    # Check built-in types
    try:
        NodeType(node_type)
        return True
    except ValueError:
        pass

    # Check custom/MCP types in combined mapping
    if node_type in COMBINED_NODE_MAPPING:
        return True

    # Check MCP nodes dynamically
    if node_type.startswith("mcp-"):
        try:
            from core.workflow.nodes.mcp_tool.registry import is_mcp_node_type
            return is_mcp_node_type(node_type)
        except ImportError:
            pass

    return False


# Load custom nodes at module import time
_load_custom_nodes_into_mapping()

# Note: MCP nodes are NOT loaded at module import time to avoid
# database access during import. They are loaded lazily when needed.
# To preload MCP nodes, call _load_mcp_nodes_into_mapping() explicitly.
