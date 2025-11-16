/**
 * Configuration hook for Weather API Node
 */

import { useCallback, useState } from 'react'
import { produce } from 'immer'
import type { WeatherAPINodeData } from './types'
import type { UseConfigReturn } from '../../../sdk/typescript/src/types'

export const useConfig = (
  id: string,
  payload: WeatherAPINodeData
): UseConfigReturn<WeatherAPINodeData> => {
  const [inputs, setInputs] = useState<WeatherAPINodeData>(payload)

  const handleFieldChange = useCallback(
    (field: keyof WeatherAPINodeData) => {
      return (value: any) => {
        const newInputs = produce(inputs, (draft) => {
          ;(draft as any)[field] = value
        })
        setInputs(newInputs)

        // In real implementation, sync to backend:
        // handleNodeDataUpdateWithSyncDraft({ id, data: newInputs })
      }
    },
    [inputs, id]
  )

  const handleBulkChange = useCallback(
    (changes: Partial<WeatherAPINodeData>) => {
      const newInputs = produce(inputs, (draft) => {
        Object.assign(draft, changes)
      })
      setInputs(newInputs)

      // In real implementation, sync to backend:
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
