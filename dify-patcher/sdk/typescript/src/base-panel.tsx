/**
 * Base Panel Component
 *
 * Wrapper component for custom node configuration panels.
 */

import type { FC, ReactNode } from 'react'
import React, { memo } from 'react'
import type { CustomNodeData, NodePanelProps } from './types'

export interface BasePanelProps<T extends CustomNodeData = CustomNodeData> extends NodePanelProps<T> {
  children?: ReactNode
  className?: string
}

/**
 * Base panel component that wraps custom node configuration UI
 *
 * This provides consistent structure for all custom node panels.
 */
export const BasePanel = <T extends CustomNodeData = CustomNodeData>({
  id,
  data,
  children,
  className = '',
}: BasePanelProps<T>) => {
  return (
    <div
      className={`custom-node-panel ${className}`}
      data-node-id={id}
      data-node-type={data.type}
    >
      <div className="mt-2">
        <div className="space-y-4 px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Create a custom panel component with automatic wrapping
 *
 * Example:
 *   const MyPanel = createPanelComponent<MyNodeData>((props) => {
 *     const { id, data } = props
 *     const { inputs, handleFieldChange } = useConfig(id, data)
 *
 *     return (
 *       <>
 *         <Field title="My Field">
 *           <Input value={inputs.myField} onChange={handleFieldChange('myField')} />
 *         </Field>
 *       </>
 *     )
 *   })
 */
export function createPanelComponent<T extends CustomNodeData = CustomNodeData>(
  render: (props: NodePanelProps<T>) => ReactNode
): FC<NodePanelProps<T>> {
  const Component: FC<NodePanelProps<T>> = (props) => {
    return (
      <BasePanel {...props}>
        {render(props)}
      </BasePanel>
    )
  }

  return memo(Component)
}
