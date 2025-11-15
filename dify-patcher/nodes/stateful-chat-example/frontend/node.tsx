/**
 * Stateful Chat Example Node - Canvas Component
 */

import React from 'react'
import type { FC } from 'react'
import type { NodeProps } from '../../../sdk/typescript/src/types'
import type { StatefulChatExampleNodeData } from './types'

export const StatefulChatExampleNode: FC<NodeProps<StatefulChatExampleNodeData>> = ({ data }) => {
  const { input_text } = data

  if (!input_text) return null

  return (
    <div className="mb-1 px-3 py-1">
      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
        {input_text}
      </div>
    </div>
  )
}

export default React.memo(StatefulChatExampleNode)
