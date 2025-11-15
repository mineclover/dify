/**
 * Default configuration for Agno Agent Node
 */

import type { NodeDefault, ValidationResult } from '../../../sdk/typescript/src/types'
import { VarType } from '../../../sdk/typescript/src/types'
import type { AgnoAgentNodeData } from './types'

export const agnoAgentDefault: NodeDefault<AgnoAgentNodeData> = {
  defaultValue: {
    title: 'Agno Agent',
    desc: 'Execute Agno AgentOS agent',
    type: 'agno-agent',
    agno_base_url: '',
    agent_id: '',
    api_key: '',
    message: '',
    session_id: '',
    user_id: '',
    stream: false,
    timeout: 60,
  },

  checkValid(payload: AgnoAgentNodeData, t: any): ValidationResult {
    if (!payload.agno_base_url || payload.agno_base_url.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Agno Base URL is required',
      }
    }

    if (!payload.agent_id || payload.agent_id.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Agent ID is required',
      }
    }

    if (!payload.api_key || payload.api_key.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'API Key is required',
      }
    }

    if (!payload.message || payload.message.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Message is required',
      }
    }

    if (payload.timeout && (payload.timeout < 1 || payload.timeout > 300)) {
      return {
        isValid: false,
        errorMessage: 'Timeout must be between 1 and 300 seconds',
      }
    }

    return {
      isValid: true,
    }
  },

  getOutputVars(payload: AgnoAgentNodeData) {
    return [
      {
        variable: 'response',
        type: VarType.String,
        description: 'Agent response text',
      },
      {
        variable: 'run_id',
        type: VarType.String,
        description: 'Agno run identifier',
      },
      {
        variable: 'session_id',
        type: VarType.String,
        description: 'Session ID used for this run',
      },
      {
        variable: 'status',
        type: VarType.String,
        description: 'Execution status',
      },
      {
        variable: 'execution_time',
        type: VarType.Number,
        description: 'Execution time in milliseconds',
      },
      {
        variable: 'error_message',
        type: VarType.String,
        description: 'Error message if failed',
      },
    ]
  },
}
