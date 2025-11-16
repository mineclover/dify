/**
 * Base Node Component
 *
 * Wrapper component for custom nodes displayed on the workflow canvas.
 */

import type { FC, ReactNode } from 'react'
import React, { memo } from 'react'
import type { CustomNodeData, NodeProps } from './types'

export interface BaseNodeProps<T extends CustomNodeData = CustomNodeData> extends NodeProps<T> {
  children?: ReactNode
  className?: string
}

/**
 * Base node component that wraps custom node canvas UI
 *
 * This provides consistent styling and behavior for all custom nodes.
 */
export const BaseNode = <T extends CustomNodeData = CustomNodeData>({
  id,
  data,
  selected,
  children,
  className = '',
}: BaseNodeProps<T>) => {
  return (
    <div
      className={`
        workflow-node
        bg-white dark:bg-gray-800
        border-2 rounded-lg
        shadow-sm
        transition-all
        ${selected ? 'border-primary-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'}
        ${data._runningStatus === 'running' ? 'animate-pulse' : ''}
        ${data._runningStatus === 'succeeded' ? 'border-green-500' : ''}
        ${data._runningStatus === 'failed' ? 'border-red-500' : ''}
        ${className}
      `}
      data-node-id={id}
      data-node-type={data.type}
    >
      {children}
    </div>
  )
}

/**
 * Create a custom node component with automatic wrapping
 *
 * Example:
 *   const MyNode = createNodeComponent<MyNodeData>((props) => {
 *     const { data } = props
 *     return <div>{data.myField}</div>
 *   })
 */
export function createNodeComponent<T extends CustomNodeData = CustomNodeData>(
  render: (props: NodeProps<T>) => ReactNode
): FC<NodeProps<T>> {
  const Component: FC<NodeProps<T>> = (props) => {
    return (
      <BaseNode {...props}>
        {render(props)}
      </BaseNode>
    )
  }

  return memo(Component)
}
