/**
 * Configuration hook for Stateful Chat Example Node
 */

import { useCallback, useState } from 'react'
import { produce } from 'immer'
import type { StatefulChatExampleNodeData } from './types'
import type { UseConfigReturn } from '../../../sdk/typescript/src/types'

export const useConfig = (
  id: string,
  payload: StatefulChatExampleNodeData
): UseConfigReturn<StatefulChatExampleNodeData> => {
  const [inputs, setInputs] = useState<StatefulChatExampleNodeData>(payload)

  const handleFieldChange = useCallback(
    (field: keyof StatefulChatExampleNodeData) => {
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
    (changes: Partial<StatefulChatExampleNodeData>) => {
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
