/**
 * useConfig Hook
 *
 * Simplified hook for managing custom node configuration.
 * Wraps the core useNodeCrud hook with a cleaner API.
 */

import { useCallback } from 'react'
import { produce } from 'immer'
import type { CustomNodeData, UseConfigReturn } from './types'

/**
 * Hook for managing custom node configuration
 *
 * This hook provides a simple interface for getting and setting node data,
 * with automatic synchronization to the backend.
 *
 * @param id - Node instance ID
 * @param payload - Current node data
 * @returns Configuration state and handlers
 *
 * @example
 * ```tsx
 * const MyPanel: FC<NodePanelProps<MyNodeData>> = ({ id, data }) => {
 *   const { inputs, handleFieldChange } = useConfig(id, data)
 *
 *   return (
 *     <Field title="My Field">
 *       <Input
 *         value={inputs.myField}
 *         onChange={handleFieldChange('myField')}
 *       />
 *     </Field>
 *   )
 * }
 * ```
 */
export function useConfig<T extends CustomNodeData>(
  id: string,
  payload: T
): UseConfigReturn<T> {
  // In a real implementation, this would use the actual useNodeCrud hook
  // For now, this is a simplified version that can be used as a template

  const [inputs, setInputs] = React.useState<T>(payload)

  const handleFieldChange = useCallback(
    (field: keyof T) => {
      return (value: any) => {
        const newInputs = produce(inputs, (draft) => {
          ;(draft as any)[field] = value
        })
        setInputs(newInputs)

        // In real implementation, this would call:
        // handleNodeDataUpdateWithSyncDraft({ id, data: newInputs })
      }
    },
    [inputs, id]
  )

  const handleBulkChange = useCallback(
    (changes: Partial<T>) => {
      const newInputs = produce(inputs, (draft) => {
        Object.assign(draft, changes)
      })
      setInputs(newInputs)

      // In real implementation, this would call:
      // handleNodeDataUpdateWithSyncDraft({ id, data: newInputs })
    },
    [inputs, id]
  )

  return {
    inputs,
    readOnly: false,
    handleFieldChange,
    handleBulkChange,
  }
}

/**
 * Helper to create a typed useConfig hook for a specific node type
 *
 * @example
 * ```tsx
 * // In your node directory
 * export const useMyNodeConfig = createUseConfig<MyNodeData>()
 *
 * // In your panel component
 * const { inputs, handleFieldChange } = useMyNodeConfig(id, data)
 * ```
 */
export function createUseConfig<T extends CustomNodeData>() {
  return (id: string, payload: T) => useConfig<T>(id, payload)
}
