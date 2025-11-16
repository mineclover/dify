/**
 * Stateful Chat Example Node - Configuration Panel
 *
 * This panel demonstrates state management UI configuration
 */

import React from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfig } from './use-config'
import { useAvailableVarList } from '../../../sdk/typescript/src/hooks/use-available-var-list'
import type { NodePanelProps } from '../../../sdk/typescript/src/types'
import type { StatefulChatExampleNodeData } from './types'
import { VarType } from '../../../sdk/typescript/src/types'

// Import Dify UI components
import Field from '@/app/components/workflow/nodes/_base/components/field'
import VarReferencePicker from '@/app/components/workflow/nodes/_base/components/variable/var-reference-picker'
import Switch from '@/app/components/base/switch'
import InputNumber from '@/app/components/base/input-number'

export const StatefulChatExamplePanel: FC<NodePanelProps<StatefulChatExampleNodeData>> = ({ id, data }) => {
  const { t } = useTranslation()
  const { inputs, handleFieldChange } = useConfig(id, data)

  // Get available variables (filtered to strings for user_message)
  const { availableVars, availableNodesWithParent } = useAvailableVarList(id, {
    onlyLeafNodeVar: false,
    filterVar: (varPayload: any) => {
      return varPayload.type === VarType.String
    },
  })

  return (
    <div className="mt-2">
      <div className="space-y-4 px-4 pb-4">
        {/* User Message Input */}
        <Field
          title="User Message"
          required
          tooltip="The user's message to process. This can be connected to a variable or entered directly."
        >
          <VarReferencePicker
            nodeId={id}
            isShowNodeName
            availableVars={availableVars}
            availableNodesWithParent={availableNodesWithParent}
            value={inputs.user_message || ''}
            onChange={handleFieldChange('user_message')}
          />
        </Field>

        {/* Detailed Mode Toggle */}
        <Field
          title="Detailed Mode"
          tooltip="Enable detailed response mode. This demonstrates using feature flags in state management."
        >
          <div className="flex items-center space-x-2">
            <Switch
              defaultValue={inputs.enable_detailed_mode || false}
              onChange={handleFieldChange('enable_detailed_mode')}
            />
            <span className="text-sm text-gray-500">
              {inputs.enable_detailed_mode ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </Field>

        {/* Max History Items */}
        <Field
          title="Max History Items"
          tooltip="Maximum number of conversation history items to keep (1-100). This demonstrates accumulator pattern with limits."
        >
          <InputNumber
            value={inputs.max_history_items || 10}
            onChange={handleFieldChange('max_history_items')}
            min={1}
            max={100}
            className="w-full"
          />
        </Field>

        {/* State Management Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            State Management Patterns
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Turn Counter:</strong> Tracks conversation turns</li>
            <li>• <strong>Chat History:</strong> Accumulates messages (max {inputs.max_history_items || 10} items)</li>
            <li>• <strong>Session Context:</strong> Stores intent, topics, entities</li>
            <li>• <strong>Feature Flags:</strong> Controls detailed mode</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Next step:</strong> Connect output variables to Variable Assigner nodes to persist state across conversation turns.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(StatefulChatExamplePanel)
