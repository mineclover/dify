/**
 * Configuration hook for Test Node Node
 */

import { useCallback, useState } from 'react'
import { produce } from 'immer'
import type { TestNodeNodeData } from './types'
import type { UseConfigReturn } from '../../../sdk/typescript/src/types'

export const useConfig = (
  id: string,
  payload: TestNodeNodeData
): UseConfigReturn<TestNodeNodeData> => {
  const [inputs, setInputs] = useState<TestNodeNodeData>(payload)

  const handleFieldChange = useCallback(
    (field: keyof TestNodeNodeData) => {
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
    (changes: Partial<TestNodeNodeData>) => {
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
