"""
Stateful Chat Example Node

Demonstrates state management patterns in Dify workflows:
- Reading/writing conversation variables
- Tracking conversation history
- Maintaining session context
- Counter increments
- Feature flags
"""

from typing import Any

from dify_custom_nodes import (
    BaseCustomNode,
    NodeRunResult,
    StateManager,
    StatePattern,
    WorkflowNodeExecutionStatus,
    register_node,
)
from dify_custom_nodes.types import OutputVar, VarType


@register_node("stateful-chat-example", version="1")
class StatefulChatExampleNode(BaseCustomNode):
    """
    Example node demonstrating stateful conversation patterns

    This node shows how to:
    1. Track conversation history across multiple turns
    2. Maintain a turn counter
    3. Store user preferences
    4. Use feature flags for conditional behavior
    5. Build session context incrementally
    """

    @classmethod
    def get_schema(cls) -> dict[str, Any]:
        """
        Schema for node configuration
        """
        return {
            "type": "object",
            "properties": {
                "user_message": {
                    "type": "string",
                    "title": "User Message",
                    "description": "Current user message to process",
                },
                "enable_detailed_mode": {
                    "type": "boolean",
                    "title": "Detailed Mode",
                    "description": "Enable detailed response mode (uses feature flag)",
                    "default": False,
                },
                "max_history_items": {
                    "type": "number",
                    "title": "Max History Items",
                    "description": "Maximum conversation history items to keep",
                    "default": 10,
                    "minimum": 1,
                    "maximum": 100,
                },
            },
            "required": ["user_message"],
        }

    @classmethod
    def get_output_vars(cls, payload: dict[str, Any] | None = None) -> list[OutputVar]:
        """
        Define output variables
        """
        return [
            {
                "variable": "response",
                "type": VarType.String,
                "description": "Generated response based on conversation state",
            },
            {
                "variable": "turn_count",
                "type": VarType.Number,
                "description": "Current conversation turn count",
            },
            {
                "variable": "history_length",
                "type": VarType.Number,
                "description": "Number of items in conversation history",
            },
            # Outputs for Variable Assigner to update conversation variables
            {
                "variable": "conv_var_turn_count",
                "type": VarType.Number,
                "description": "Updated turn count for Variable Assigner",
            },
            {
                "variable": "conv_var_chat_history",
                "type": VarType.Array,
                "description": "Updated chat history for Variable Assigner",
            },
            {
                "variable": "conv_var_session_context",
                "type": VarType.Object,
                "description": "Updated session context for Variable Assigner",
            },
            {
                "variable": "conv_var_feature_flags",
                "type": VarType.Object,
                "description": "Updated feature flags for Variable Assigner",
            },
        ]

    def _run(self) -> NodeRunResult:
        """
        Execute stateful chat logic
        """
        # Get inputs
        user_message = self.get_input("user_message", "")
        enable_detailed = self.get_input("enable_detailed_mode", False)
        max_history = self.get_input("max_history_items", 10)

        # Create StateManager
        state = StateManager(self.graph_runtime_state.variable_pool)

        # ═══════════════════════════════════════════════════════════
        # Pattern 1: Counter Increment
        # ═══════════════════════════════════════════════════════════
        turn_count_output = StatePattern.counter_increment(state, "turn_count")
        current_turn = (state.get_conversation_var("turn_count") or 0) + 1

        # ═══════════════════════════════════════════════════════════
        # Pattern 2: Feature Flags
        # ═══════════════════════════════════════════════════════════
        # Initialize feature flags if not exists
        feature_flags = state.get_conversation_var("feature_flags") or {}
        feature_flags["detailed_mode"] = enable_detailed

        # Check feature flag
        is_detailed = StatePattern.feature_flag_check(state, "detailed_mode", False)

        # ═══════════════════════════════════════════════════════════
        # Pattern 3: Conversation History (Accumulator Pattern)
        # ═══════════════════════════════════════════════════════════
        chat_history = state.get_conversation_var("chat_history") or []

        # Add new message to history
        new_entry = {
            "turn": current_turn,
            "role": "user",
            "content": user_message,
            "timestamp": None,  # You would set this to current time
        }

        # Keep only last N items
        updated_history = (chat_history + [new_entry])[-max_history:]

        # ═══════════════════════════════════════════════════════════
        # Pattern 4: Session Context
        # ═══════════════════════════════════════════════════════════
        session_context = state.get_conversation_var("session_context") or StatePattern.session_context_init()

        # Update session context
        session_context["turn_count"] = current_turn
        session_context["topic_history"] = session_context.get("topic_history", []) + [
            self._extract_topic(user_message)
        ]

        # Detect intent (simple example)
        if "?" in user_message:
            session_context["intent"] = "question"
        elif any(word in user_message.lower() for word in ["please", "can you", "would you"]):
            session_context["intent"] = "request"
        else:
            session_context["intent"] = "statement"

        # ═══════════════════════════════════════════════════════════
        # Generate Response
        # ═══════════════════════════════════════════════════════════
        response = self._generate_response(
            user_message=user_message,
            turn_count=current_turn,
            history_length=len(updated_history),
            is_detailed=is_detailed,
            session_context=session_context,
        )

        # ═══════════════════════════════════════════════════════════
        # Return Results
        # ═══════════════════════════════════════════════════════════
        return {
            "status": WorkflowNodeExecutionStatus.SUCCEEDED,
            "inputs": {
                "user_message": user_message,
                "enable_detailed_mode": enable_detailed,
                "max_history_items": max_history,
            },
            "outputs": {
                # Regular outputs
                "response": response,
                "turn_count": current_turn,
                "history_length": len(updated_history),
                # Outputs for Variable Assigner
                **turn_count_output,
                **state.output_for_conv_var("chat_history", updated_history),
                **state.output_for_conv_var("session_context", session_context),
                **state.output_for_conv_var("feature_flags", feature_flags),
            },
        }

    def _extract_topic(self, message: str) -> str:
        """
        Simple topic extraction (in real implementation, use NLP)
        """
        # Very basic - just take first few words
        words = message.split()[:3]
        return " ".join(words).lower()

    def _generate_response(
        self,
        user_message: str,
        turn_count: int,
        history_length: int,
        is_detailed: bool,
        session_context: dict[str, Any],
    ) -> str:
        """
        Generate response based on conversation state
        """
        # Build response using state information
        parts = []

        if turn_count == 1:
            parts.append("Hello! This is our first interaction.")
        else:
            parts.append(f"This is turn #{turn_count} of our conversation.")

        if history_length > 1:
            parts.append(f"I remember our last {history_length - 1} messages.")

        intent = session_context.get("intent")
        if intent:
            parts.append(f"I detect this is a {intent}.")

        if is_detailed:
            # Detailed mode - show more information
            topic_history = session_context.get("topic_history", [])
            if topic_history:
                parts.append(f"We've discussed: {', '.join(topic_history[-3:])}")

        # Echo the message (in real implementation, process with LLM)
        parts.append(f"You said: '{user_message}'")

        return " | ".join(parts)

    @classmethod
    def get_title(cls) -> str:
        return "Stateful Chat Example"

    @classmethod
    def get_description(cls) -> str:
        return "Example node demonstrating conversation state management patterns"
