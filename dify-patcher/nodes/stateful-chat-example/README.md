# Stateful Chat Example Node

**A comprehensive example demonstrating state management patterns in Dify workflows.**

This node shows how to build stateful conversations by leveraging Dify's conversation variables, counters, accumulators, and session context management.

## 📚 Purpose

This example node teaches you how to:

1. **Track conversation history** across multiple turns
2. **Maintain turn counters** that persist across sessions
3. **Store and update user preferences** via feature flags
4. **Build session context** incrementally
5. **Use StateManager** helpers from dify-patcher SDK

## 🎯 State Management Patterns Demonstrated

### Pattern 1: Counter Increment
Automatically tracks conversation turn count using `StatePattern.counter_increment()`.

### Pattern 2: Feature Flags
Stores user preferences (like "detailed mode") in conversation variables for conditional behavior.

### Pattern 3: Accumulator Pattern (Chat History)
Collects messages over time, maintaining only the last N items to prevent unbounded growth.

### Pattern 4: Session Context
Builds a rich context object containing:
- Detected intent (question, request, statement)
- Topic history (last 3 topics discussed)
- Entity tracking
- Turn count

## ⚙️ Configuration

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| **User Message** | string | ✅ | Current user message to process. Can be connected to `sys.query` or other string variables |
| **Detailed Mode** | boolean | ❌ | Enable detailed response mode (default: false) |
| **Max History Items** | number | ❌ | Maximum conversation history items to keep (1-100, default: 10) |

### Outputs

#### Regular Outputs
- `response` (string): Generated response based on conversation state
- `turn_count` (number): Current conversation turn count
- `history_length` (number): Number of items in conversation history

#### Conversation Variable Outputs (for Variable Assigner)
- `conv_var_turn_count` (number): Updated turn count
- `conv_var_chat_history` (array): Updated chat history
- `conv_var_session_context` (object): Updated session context
- `conv_var_feature_flags` (object): Updated feature flags

## 📖 Usage Example

### Workflow Setup

```
[Start]
    ↓
    user_input = "Hello, how are you?"
    ↓
[Stateful Chat Example]
    ↓ (outputs)
    - response: "Hello! This is turn #1..."
    - turn_count: 1
    - conv_var_turn_count: 1
    - conv_var_chat_history: [{turn: 1, role: "user", content: "Hello..."}]
    ↓
[Variable Assigner #1]
    operation: SET
    variable: conversation.turn_count
    value: [stateful-chat-example.conv_var_turn_count]
    ↓
[Variable Assigner #2]
    operation: SET
    variable: conversation.chat_history
    value: [stateful-chat-example.conv_var_chat_history]
    ↓
[Variable Assigner #3]
    operation: SET
    variable: conversation.session_context
    value: [stateful-chat-example.conv_var_session_context]
    ↓
[Variable Assigner #4]
    operation: SET
    variable: conversation.feature_flags
    value: [stateful-chat-example.conv_var_feature_flags]
    ↓
[Answer]
    output: [stateful-chat-example.response]
```

### Conversation Flow

**Turn 1:**
```
User: "Hello, how are you?"
Bot: "Hello! This is our first interaction. | I detect this is a statement. | You said: 'Hello, how are you?'"
```

**Turn 2 (with Detailed Mode enabled):**
```
User: "Can you help me with something?"
Bot: "This is turn #2 of our conversation. | I remember our last 1 messages. | I detect this is a request. | We've discussed: hello how are, can you help | You said: 'Can you help me with something?'"
```

**Turn 15:**
```
User: "What's the weather?"
Bot: "This is turn #15 of our conversation. | I remember our last 10 messages. | I detect this is a question. | You said: 'What's the weather?'"
```

## 🔧 Backend Implementation Highlights

```python
from dify_custom_nodes import StateManager, StatePattern

def _run(self) -> NodeRunResult:
    # Create StateManager
    state = StateManager(self.graph_runtime_state.variable_pool)

    # Pattern 1: Counter
    turn_count_output = StatePattern.counter_increment(state, "turn_count")

    # Pattern 2: Feature Flags
    is_detailed = StatePattern.feature_flag_check(state, "detailed_mode", False)

    # Pattern 3: Accumulator
    chat_history = state.get_conversation_var("chat_history") or []
    updated_history = (chat_history + [new_entry])[-max_history:]

    # Pattern 4: Session Context
    session_context = state.get_conversation_var("session_context") or StatePattern.session_context_init()
    session_context["turn_count"] = current_turn

    return {
        "status": WorkflowNodeExecutionStatus.SUCCEEDED,
        "outputs": {
            "response": response,
            **turn_count_output,
            **state.output_for_conv_var("chat_history", updated_history),
            **state.output_for_conv_var("session_context", session_context),
        }
    }
```

## 💡 Key Learnings

1. **StateManager simplifies state access**
   - `state.get_conversation_var('name')` - Read persistent state
   - `state.output_for_conv_var('name', value)` - Prepare output for Variable Assigner

2. **Conversation variables persist across sessions**
   - Stored in database
   - Survive app restarts
   - Scoped to conversation

3. **Variable Assigner is required for state updates**
   - Custom nodes output `conv_var_*` fields
   - Variable Assigner nodes consume these and update conversation variables
   - This two-step process ensures data flow visibility in workflow canvas

4. **Accumulator pattern prevents unbounded growth**
   - Keep only last N items: `(history + [new_item])[-max_items:]`
   - Prevents memory/database bloat

## 📚 Related Documentation

- **State Management Analysis**: `/dify-patcher/STATE_MANAGEMENT_ANALYSIS.md`
- **StateManager API**: `/dify-patcher/sdk/python/dify_custom_nodes/state_helpers.py`
- **Custom Panel Guide**: `/dify-patcher/conventions/custom-panel-guide.md`

## 🚀 Try It Yourself

1. **Install the node**:
   ```bash
   cd dify-patcher
   cd installer/cli && npm start -- install --target ../../dify --mode dev
   ```

2. **Create a workflow** in Dify with:
   - Start node
   - Stateful Chat Example node
   - 4x Variable Assigner nodes (for turn_count, chat_history, session_context, feature_flags)
   - Answer node

3. **Test conversation continuity**:
   - Send multiple messages
   - Observe turn count incrementing
   - Toggle detailed mode on/off
   - Notice how context accumulates

## 📝 License

MIT
