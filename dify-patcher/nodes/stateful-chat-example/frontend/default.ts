/**
 * Default configuration for Stateful Chat Example Node
 */

import type { NodeDefault, ValidationResult } from '../../../sdk/typescript/src/types'
import { VarType } from '../../../sdk/typescript/src/types'
import type { StatefulChatExampleNodeData } from './types'

export const statefulChatExampleDefault: NodeDefault<StatefulChatExampleNodeData> = {
  defaultValue: {
    title: 'Stateful Chat Example',
    desc: 'Demonstrates conversation state management',
    type: 'stateful-chat-example',
    user_message: '',
    enable_detailed_mode: false,
    max_history_items: 10,
  },

  checkValid(payload: StatefulChatExampleNodeData, t: any): ValidationResult {
    if (!payload.user_message || payload.user_message.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'User message is required',
      }
    }

    if (payload.max_history_items && (payload.max_history_items < 1 || payload.max_history_items > 100)) {
      return {
        isValid: false,
        errorMessage: 'Max history items must be between 1 and 100',
      }
    }

    return {
      isValid: true,
    }
  },

  getOutputVars(payload: StatefulChatExampleNodeData) {
    return [
      {
        variable: 'response',
        type: VarType.String,
        description: 'Generated response based on conversation state',
      },
      {
        variable: 'turn_count',
        type: VarType.Number,
        description: 'Current conversation turn count',
      },
      {
        variable: 'history_length',
        type: VarType.Number,
        description: 'Number of items in conversation history',
      },
      {
        variable: 'conv_var_turn_count',
        type: VarType.Number,
        description: 'Updated turn count for Variable Assigner',
      },
      {
        variable: 'conv_var_chat_history',
        type: VarType.Array,
        description: 'Updated chat history for Variable Assigner',
      },
      {
        variable: 'conv_var_session_context',
        type: VarType.Object,
        description: 'Updated session context for Variable Assigner',
      },
      {
        variable: 'conv_var_feature_flags',
        type: VarType.Object,
        description: 'Updated feature flags for Variable Assigner',
      },
    ]
  },
}
