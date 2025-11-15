/**
 * Type definitions for Agno Agent Node
 */

import type { CustomNodeData } from '../../../sdk/typescript/src/types'

export interface AgnoAgentNodeData extends CustomNodeData {
  type: 'agno-agent'
  agno_base_url: string
  agent_id: string
  api_key: string
  message: string
  session_id?: string
  user_id?: string
  stream?: boolean
  timeout?: number
}
