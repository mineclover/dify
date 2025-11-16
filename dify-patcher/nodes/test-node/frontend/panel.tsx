/**
 * Test Node Node - Configuration Panel
 */

import React from 'react'
import type { FC } from 'react'
import { useConfig } from './use-config'
import type { NodePanelProps } from '../../../sdk/typescript/src/types'
import type { TestNodeNodeData } from './types'

export const TestNodePanel: FC<NodePanelProps<TestNodeNodeData>> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="mt-2">
      <div className="space-y-4 px-4 pb-4">
        {/* TODO: Add configuration fields */}
        <div>
          <label className="block text-sm font-medium mb-2">Input Text</label>
          <input
            type="text"
            value={inputs.input_text || ''}
            onChange={(e) => handleFieldChange('input_text')(e.target.value)}
            placeholder="Enter text..."
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>
    </div>
  )
}

export default React.memo(TestNodePanel)
