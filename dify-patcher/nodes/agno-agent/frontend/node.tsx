/**
 * Agno Agent Node - Canvas Component
 *
 * Displays Agno agent information on the workflow canvas
 * Uses Dify's NodeProps for full compatibility
 */

import React from 'react'
import type { FC } from 'react'
import type { NodeProps } from '@dify/types'
import type { AgnoAgentNodeData } from './types'

export const AgnoAgentNode: FC<NodeProps<AgnoAgentNodeData>> = ({ data }) => {
  const { agent_id, agno_base_url } = data

  if (!agent_id) return null

  return (
    <div className="mb-1 px-3 py-1">
      <div className="text-xs text-gray-900 dark:text-gray-100 font-medium truncate">
        🤖 {agent_id}
      </div>
      {agno_base_url && (
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {agno_base_url}
        </div>
      )}
    </div>
  )
}

export default React.memo(AgnoAgentNode)
