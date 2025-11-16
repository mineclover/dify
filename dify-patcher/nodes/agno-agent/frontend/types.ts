/**
 * Type definitions for Agno Agent Node
 *
 * Uses Dify's CommonNodeType directly for full compatibility
 * with the Dify workflow system.
 */

import type { CommonNodeType } from '@dify/types'

/**
 * Agno Agent Node Data
 *
 * Extends Dify's CommonNodeType to ensure full compatibility
 * with the workflow system while adding Agno-specific fields.
 */
export interface AgnoAgentNodeData extends CommonNodeType<{
  agno_base_url: string
  agent_id: string
  api_key: string
  message: string
  session_id?: string
  user_id?: string
  stream?: boolean
  timeout?: number
}> {
  type: 'agno-agent'
}
