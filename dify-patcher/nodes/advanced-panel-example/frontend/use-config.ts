/**
 * Configuration hook for Advanced Panel Example Node
 */

import { useCallback, useState } from 'react'
import { produce } from 'immer'
import type { AdvancedPanelExampleNodeData } from './types'
import type { UseConfigReturn } from '../../../sdk/typescript/src/types'

export const useConfig = (
  id: string,
  payload: AdvancedPanelExampleNodeData
): UseConfigReturn<AdvancedPanelExampleNodeData> => {
  const [inputs, setInputs] = useState<AdvancedPanelExampleNodeData>(payload)

  const handleFieldChange = useCallback(
    (field: keyof AdvancedPanelExampleNodeData) => {
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
    (changes: Partial<AdvancedPanelExampleNodeData>) => {
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
