/**
 * Type definitions for Stateful Chat Example Node
 */

import type { CustomNodeData } from '../../../sdk/typescript/src/types'

export interface StatefulChatExampleNodeData extends CustomNodeData {
  type: 'stateful-chat-example'
  user_message: string
  enable_detailed_mode?: boolean
  max_history_items?: number
}
