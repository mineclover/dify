"""
State management helpers for custom nodes

This module provides utilities for managing state in Dify workflows,
including conversation variables, environment variables, and system variables.
"""

from typing import Any, Optional


class StateManager:
    """
    Helper class for managing workflow state in custom nodes

    Provides convenient methods for reading and preparing outputs for
    conversation variables, environment variables, and system variables.

    Usage:
        class MyNode(BaseCustomNode):
            def _run(self) -> NodeRunResult:
                state = StateManager(self.graph_runtime_state.variable_pool)

                # Read conversation state
                user_prefs = state.get_conversation_var('preferences')

                # Process
                result = self.process(user_prefs)

                # Prepare output for Variable Assigner to update state
                return {
                    'status': WorkflowNodeExecutionStatus.SUCCEEDED,
                    'outputs': {
                        'result': result,
                        **state.output_for_conv_var('last_result', result)
                    }
                }
    """

    # Node IDs for special variable types
    CONVERSATION_VARIABLE_NODE_ID = "sys.conversation_variables"
    ENVIRONMENT_VARIABLE_NODE_ID = "sys.environment_variables"
    SYSTEM_VARIABLE_NODE_ID = "sys"

    def __init__(self, variable_pool: Any):
        """
        Initialize StateManager with a variable pool

        Args:
            variable_pool: The variable pool from graph_runtime_state
        """
        self.pool = variable_pool

    def get_conversation_var(self, name: str) -> Optional[Any]:
        """
        Get conversation variable by name

        Conversation variables persist across conversation sessions and are
        stored in the database.

        Args:
            name: Variable name

        Returns:
            Variable value or None if not found

        Example:
            >>> user_count = state.get_conversation_var('user_count')
            >>> if user_count is None:
            ...     user_count = 0
        """
        try:
            var = self.pool.get([self.CONVERSATION_VARIABLE_NODE_ID, name])
            return var.to_object() if var else None
        except Exception:
            return None

    def get_env_var(self, name: str) -> Optional[Any]:
        """
        Get environment variable by name

        Environment variables are app-level global configuration values set
        by administrators. They are read-only during workflow execution.

        Args:
            name: Variable name

        Returns:
            Variable value or None if not found

        Example:
            >>> api_base_url = state.get_env_var('api_base_url')
            >>> max_retries = state.get_env_var('max_retries') or 3
        """
        try:
            var = self.pool.get([self.ENVIRONMENT_VARIABLE_NODE_ID, name])
            return var.to_object() if var else None
        except Exception:
            return None

    def get_system_var(self, name: str) -> Optional[Any]:
        """
        Get system variable by name

        System variables include runtime information like:
        - conversation_id
        - user_id
        - app_id
        - workflow_id
        - query (user input)

        Args:
            name: Variable name

        Returns:
            Variable value or None if not found

        Example:
            >>> conversation_id = state.get_system_var('conversation_id')
            >>> user_query = state.get_system_var('query')
        """
        try:
            var = self.pool.get([self.SYSTEM_VARIABLE_NODE_ID, name])
            return var.to_object() if var else None
        except Exception:
            return None

    def get_node_var(self, node_id: str, var_name: str) -> Optional[Any]:
        """
        Get output variable from another node

        Args:
            node_id: ID of the node that produced the variable
            var_name: Name of the output variable

        Returns:
            Variable value or None if not found

        Example:
            >>> llm_output = state.get_node_var('llm-node-1', 'output')
            >>> api_result = state.get_node_var('http-request-1', 'body')
        """
        try:
            var = self.pool.get([node_id, var_name])
            return var.to_object() if var else None
        except Exception:
            return None

    def output_for_conv_var(self, name: str, value: Any) -> dict[str, Any]:
        """
        Generate output dict for Variable Assigner to update conversation variable

        This method creates an output that can be consumed by a Variable Assigner
        node to update conversation variables, making them persistent across sessions.

        Args:
            name: Conversation variable name to update
            value: New value for the variable

        Returns:
            Dictionary with output key-value pair

        Example:
            >>> # In your node's _run method
            >>> return {
            ...     'status': WorkflowNodeExecutionStatus.SUCCEEDED,
            ...     'outputs': {
            ...         'result': processed_data,
            ...         **state.output_for_conv_var('user_count', count + 1),
            ...         **state.output_for_conv_var('last_action', 'processed')
            ...     }
            ... }

        Workflow Setup:
            [Your Custom Node] → outputs: conv_var_user_count, conv_var_last_action
                ↓
            [Variable Assigner] → Set conversation.user_count = [YourNode.conv_var_user_count]
                                  → Set conversation.last_action = [YourNode.conv_var_last_action]
        """
        return {f'conv_var_{name}': value}

    def get_all_conversation_vars(self) -> dict[str, Any]:
        """
        Get all conversation variables as a dictionary

        Returns:
            Dictionary of all conversation variables

        Example:
            >>> all_vars = state.get_all_conversation_vars()
            >>> print(all_vars)
            {'user_count': 5, 'preferences': {'theme': 'dark'}, 'history': [...]}
        """
        try:
            conv_vars = {}
            # Access the conversation_variables from the pool
            if hasattr(self.pool, 'conversation_variables'):
                for var in self.pool.conversation_variables:
                    if hasattr(var, 'name') and hasattr(var, 'value'):
                        conv_vars[var.name] = var.value
            return conv_vars
        except Exception:
            return {}

    def create_accumulator_output(
        self,
        conv_var_name: str,
        new_item: Any,
        existing_list: Optional[list] = None
    ) -> dict[str, Any]:
        """
        Create output for accumulator pattern (appending to a list)

        This is a common pattern for collecting results across multiple workflow runs.

        Args:
            conv_var_name: Name of the conversation variable holding the list
            new_item: New item to append to the list
            existing_list: Existing list (if already retrieved), or None to read from state

        Returns:
            Output dict for Variable Assigner

        Example:
            >>> # Accumulate chat history
            >>> current_history = state.get_conversation_var('chat_history') or []
            >>> new_entry = {'role': 'user', 'content': user_input}
            >>> output = state.create_accumulator_output('chat_history', new_entry, current_history)
            >>> return {
            ...     'status': WorkflowNodeExecutionStatus.SUCCEEDED,
            ...     'outputs': output
            ... }

        Workflow Setup:
            [Variable Assigner] → Operation: SET
                                → Variable: conversation.chat_history
                                → Value: [YourNode.conv_var_chat_history]
        """
        if existing_list is None:
            existing_list = self.get_conversation_var(conv_var_name) or []

        updated_list = existing_list + [new_item]
        return self.output_for_conv_var(conv_var_name, updated_list)


class StatePattern:
    """
    Common state management patterns for workflows

    Provides ready-to-use patterns for common stateful scenarios.
    """

    @staticmethod
    def counter_increment(state: StateManager, counter_name: str) -> dict[str, Any]:
        """
        Increment a counter stored in conversation variables

        Args:
            state: StateManager instance
            counter_name: Name of the counter variable

        Returns:
            Output dict for Variable Assigner

        Example:
            >>> # Track API call count
            >>> output = StatePattern.counter_increment(state, 'api_calls')
        """
        current = state.get_conversation_var(counter_name) or 0
        return state.output_for_conv_var(counter_name, current + 1)

    @staticmethod
    def session_context_init() -> dict[str, Any]:
        """
        Initialize a session context structure

        Returns:
            Initial session context dictionary

        Example:
            >>> context = StatePattern.session_context_init()
            >>> # Store via Variable Assigner: conversation.session_context = context
        """
        return {
            'intent': None,
            'entities': {},
            'turn_count': 0,
            'topic_history': [],
            'created_at': None  # Set by your node
        }

    @staticmethod
    def rate_limit_check(
        state: StateManager,
        quota_var_name: str,
        daily_limit: int
    ) -> tuple[bool, int]:
        """
        Check if rate limit quota is available

        Args:
            state: StateManager instance
            quota_var_name: Name of the quota tracking variable
            daily_limit: Maximum allowed per day

        Returns:
            (is_allowed, remaining_quota)

        Example:
            >>> allowed, remaining = StatePattern.rate_limit_check(
            ...     state, 'daily_api_quota', 100
            ... )
            >>> if not allowed:
            ...     return error_result("Daily quota exceeded")
        """
        quota = state.get_conversation_var(quota_var_name) or {
            'used_today': 0,
            'last_reset': None
        }

        used = quota.get('used_today', 0)
        remaining = daily_limit - used
        is_allowed = remaining > 0

        return is_allowed, remaining

    @staticmethod
    def feature_flag_check(state: StateManager, flag_name: str, default: bool = False) -> bool:
        """
        Check if a feature flag is enabled

        Args:
            state: StateManager instance
            flag_name: Name of the feature flag
            default: Default value if flag not found

        Returns:
            True if feature is enabled, False otherwise

        Example:
            >>> if StatePattern.feature_flag_check(state, 'use_advanced_mode'):
            ...     result = advanced_processing()
            ... else:
            ...     result = simple_processing()
        """
        flags = state.get_conversation_var('feature_flags') or {}
        return flags.get(flag_name, default)


# Convenience function for quick StateManager creation
def create_state_manager(node: Any) -> StateManager:
    """
    Create StateManager from a node instance

    Args:
        node: Custom node instance (must have graph_runtime_state.variable_pool)

    Returns:
        StateManager instance

    Example:
        >>> class MyNode(BaseCustomNode):
        ...     def _run(self):
        ...         state = create_state_manager(self)
        ...         user_data = state.get_conversation_var('user_data')
    """
    return StateManager(node.graph_runtime_state.variable_pool)
