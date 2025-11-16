/**
 * Agno Agent Node - Configuration Panel
 *
 * Provides UI for configuring Agno AgentOS agent integration
 * Uses Dify's type system for full workflow integration
 */

import React from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfig } from './use-config'
import { useAvailableVarList } from '../../../sdk/typescript/src/hooks/use-available-var-list'
import type { NodePanelProps } from '@dify/types'
import type { AgnoAgentNodeData } from './types'
import { VarType } from '../../../sdk/typescript/src/types'

// Import Dify UI components
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Input from '@/app/components/workflow/nodes/_base/components/input'
import VarReferencePicker from '@/app/components/workflow/nodes/_base/components/variable/var-reference-picker'
import Switch from '@/app/components/base/switch'
import InputNumber from '@/app/components/base/input-number'
import Collapse from '@/app/components/workflow/nodes/_base/components/collapse'

export const AgnoAgentPanel: FC<NodePanelProps<AgnoAgentNodeData>> = ({ id, data }) => {
  const { t } = useTranslation()
  const { inputs, handleFieldChange } = useConfig(id, data)

  // Get available variables (filtered to strings for message)
  const { availableVars, availableNodesWithParent } = useAvailableVarList(id, {
    onlyLeafNodeVar: false,
    filterVar: (varPayload: any) => {
      return varPayload.type === VarType.String
    },
  })

  return (
    <div className="mt-2">
      <div className="space-y-4 px-4 pb-4">
        {/* Agno Base URL */}
        <Field
          title="Agno Base URL"
          required
          tooltip="Base URL of your Agno AgentOS instance (e.g., https://your-agno.com)"
        >
          <Input
            value={inputs.agno_base_url || ''}
            onChange={handleFieldChange('agno_base_url')}
            placeholder="https://your-agno.com"
          />
        </Field>

        {/* Agent ID */}
        <Field
          title="Agent ID"
          required
          tooltip="Identifier of the agent to execute"
        >
          <Input
            value={inputs.agent_id || ''}
            onChange={handleFieldChange('agent_id')}
            placeholder="my-agent"
          />
        </Field>

        {/* API Key */}
        <Field
          title="API Key"
          required
          tooltip="Bearer token for authentication. Use {{#env.AGNO_API_KEY#}} for environment variables."
        >
          <Input
            type="password"
            value={inputs.api_key || ''}
            onChange={handleFieldChange('api_key')}
            placeholder="••••••••••••••••"
          />
        </Field>

        {/* Message */}
        <Field
          title="Message"
          required
          tooltip="Message to send to the agent. Can use variables like {{#sys.query#}}"
        >
          <VarReferencePicker
            nodeId={id}
            isShowNodeName
            availableVars={availableVars}
            availableNodesWithParent={availableNodesWithParent}
            value={inputs.message || ''}
            onChange={handleFieldChange('message')}
          />
        </Field>

        {/* Advanced Options */}
        <Collapse
          title="Advanced Options"
          isCollapse
          defaultValue={false}
        >
          <div className="space-y-4 mt-2">
            {/* Session ID */}
            <Field
              title="Session ID"
              tooltip="Session identifier for conversation context. Auto-generated if not provided. Use {{#sys.conversation_id#}} to maintain Dify session."
            >
              <VarReferencePicker
                nodeId={id}
                isShowNodeName
                availableVars={availableVars}
                availableNodesWithParent={availableNodesWithParent}
                value={inputs.session_id || ''}
                onChange={handleFieldChange('session_id')}
              />
            </Field>

            {/* User ID */}
            <Field
              title="User ID"
              tooltip="User identifier for tracking. Use {{#sys.user_id#}} for Dify user."
            >
              <VarReferencePicker
                nodeId={id}
                isShowNodeName
                availableVars={availableVars}
                availableNodesWithParent={availableNodesWithParent}
                value={inputs.user_id || ''}
                onChange={handleFieldChange('user_id')}
              />
            </Field>

            {/* Enable Streaming */}
            <Field
              title="Enable Streaming"
              tooltip="Enable Server-Sent Events (SSE) streaming for real-time responses"
            >
              <div className="flex items-center space-x-2">
                <Switch
                  defaultValue={inputs.stream || false}
                  onChange={handleFieldChange('stream')}
                />
                <span className="text-sm text-gray-500">
                  {inputs.stream ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </Field>

            {/* Timeout */}
            <Field
              title="Timeout (seconds)"
              tooltip="Request timeout in seconds (1-300)"
            >
              <InputNumber
                value={inputs.timeout || 60}
                onChange={handleFieldChange('timeout')}
                min={1}
                max={300}
                className="w-full"
              />
            </Field>
          </div>
        </Collapse>

        {/* Info Panel */}
        <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
            🤖 Agno AgentOS Integration
          </h4>
          <ul className="text-xs text-indigo-800 dark:text-indigo-200 space-y-1">
            <li>• Execute agents deployed on Agno AgentOS</li>
            <li>• Supports session management for multi-turn conversations</li>
            <li>• Real-time streaming responses with SSE</li>
            <li>• Full error handling and timeout control</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-700">
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              <strong>Tip:</strong> Use environment variables for API keys: <code className="px-1 py-0.5 bg-indigo-100 dark:bg-indigo-800 rounded">{'{{#env.AGNO_API_KEY#}}'}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(AgnoAgentPanel)
