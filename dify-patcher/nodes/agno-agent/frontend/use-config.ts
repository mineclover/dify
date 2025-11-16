/**
 * Configuration hook for Agno Agent Node
 */

import { useCallback, useState } from 'react'
import { produce } from 'immer'
import type { AgnoAgentNodeData } from './types'
import type { UseConfigReturn } from '../../../sdk/typescript/src/types'

export const useConfig = (
  id: string,
  payload: AgnoAgentNodeData
): UseConfigReturn<AgnoAgentNodeData> => {
  const [inputs, setInputs] = useState<AgnoAgentNodeData>(payload)

  const handleFieldChange = useCallback(
    (field: keyof AgnoAgentNodeData) => {
      return (value: any) => {
        const newInputs = produce(inputs, (draft) => {
          ;(draft as any)[field] = value
        })
        setInputs(newInputs)
      }
    },
    [inputs, id]
  )

  const handleBulkChange = useCallback(
    (changes: Partial<AgnoAgentNodeData>) => {
      const newInputs = produce(inputs, (draft) => {
        Object.assign(draft, changes)
      })
      setInputs(newInputs)
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
