/**
 * Advanced Panel Example Node - Configuration Panel
 *
 * This panel demonstrates various UI patterns and components available for custom nodes:
 * - Multiple input types (text, number, select, switch)
 * - Variable selection with type filtering
 * - Text input with variable insertion
 * - Code editor
 * - Dynamic lists (add/remove items)
 * - Conditional rendering
 * - Collapsible sections
 * - Validation
 */

import React, { useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfig } from './use-config'
import { useAvailableVarList } from '@/app/components/workflow/nodes/_base/hooks/use-available-var-list'
import type { NodePanelProps } from '../../../sdk/typescript/src/types'
import type { AdvancedPanelExampleNodeData } from './types'

// Import UI components
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Input from '@/app/components/workflow/nodes/_base/components/input'
import Textarea from '@/app/components/workflow/nodes/_base/components/textarea'
import Select from '@/app/components/workflow/nodes/_base/components/select'
import Switch from '@/app/components/workflow/nodes/_base/components/switch'
import { VarReferencePicker, InputSupportSelectVar } from '@/app/components/workflow/nodes/_base/components/variable'
import CodeEditor from '@/app/components/workflow/nodes/_base/components/code-editor'
import InputNumberWithSlider from '@/app/components/workflow/nodes/_base/components/input-number-with-slider'
import Collapse from '@/app/components/workflow/nodes/_base/components/collapse'
import Button from '@/app/components/base/button'
import { VarType } from '@/app/components/workflow/types'

export const AdvancedPanelExamplePanel: FC<NodePanelProps<AdvancedPanelExampleNodeData>> = ({ id, data }) => {
  const { t } = useTranslation()
  const { inputs, handleFieldChange } = useConfig(id, data)

  // Get available variables from workflow
  const { availableVars } = useAvailableVarList(id)

  // Filter variables by type
  const stringVars = useAvailableVarList(id, {
    filterVar: (v) => v.type === VarType.String
  }).availableVars

  // Local state for validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validation helper
  const validateUrl = (url: string) => {
    if (!url.trim()) {
      return 'URL is required'
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'URL must start with http:// or https://'
    }
    return null
  }

  // URL change handler with validation
  const handleUrlChange = (value: string) => {
    const error = validateUrl(value)
    setErrors(prev => ({ ...prev, url: error || '' }))
    handleFieldChange('url')(value)
  }

  // Dynamic list handlers
  const handleAddItem = () => {
    handleFieldChange('custom_items')([...(inputs.custom_items || []), ''])
  }

  const handleRemoveItem = (index: number) => {
    handleFieldChange('custom_items')(
      (inputs.custom_items || []).filter((_, i) => i !== index)
    )
  }

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...(inputs.custom_items || [])]
    newItems[index] = value
    handleFieldChange('custom_items')(newItems)
  }

  return (
    <div className="mt-2">
      <div className="space-y-4 px-4 pb-4">

        {/* ========== SECTION 1: Basic Inputs ========== */}
        <div className="text-sm font-semibold text-gray-700 border-b pb-2">
          Basic Inputs
        </div>

        {/* Text Input */}
        <Field
          title="Name"
          tooltip="Enter a name for this configuration"
          required
        >
          <Input
            value={inputs.name || ''}
            onChange={handleFieldChange('name')}
            placeholder="e.g., My Configuration"
          />
        </Field>

        {/* Textarea */}
        <Field
          title="Description"
          tooltip="Optional description"
        >
          <Textarea
            value={inputs.description || ''}
            onChange={handleFieldChange('description')}
            placeholder="Describe what this node does..."
            rows={3}
          />
        </Field>

        {/* Select Dropdown */}
        <Field title="Mode">
          <Select
            value={inputs.mode || 'simple'}
            onChange={handleFieldChange('mode')}
            options={[
              { value: 'simple', label: 'Simple Mode' },
              { value: 'advanced', label: 'Advanced Mode' },
              { value: 'expert', label: 'Expert Mode' }
            ]}
          />
        </Field>

        {/* Switch Toggle */}
        <Field title="Enable Feature">
          <Switch
            value={inputs.enable_feature || false}
            onChange={handleFieldChange('enable_feature')}
          />
        </Field>

        {/* Number with Slider */}
        <Field
          title="Confidence Threshold"
          tooltip="Set the minimum confidence level (0-1)"
        >
          <InputNumberWithSlider
            value={inputs.confidence || 0.5}
            onChange={handleFieldChange('confidence')}
            min={0}
            max={1}
            step={0.05}
          />
        </Field>

        {/* ========== SECTION 2: Variable Selection ========== */}
        <div className="text-sm font-semibold text-gray-700 border-b pb-2 mt-6">
          Variable Selection
        </div>

        {/* Variable Selector (String only) */}
        <Field
          title="Input Variable"
          tooltip="Select a string variable from the workflow"
          required
        >
          <VarReferencePicker
            nodeId={id}
            isShowNodeName
            availableVars={stringVars}
            value={inputs.input_variable || []}
            onChange={handleFieldChange('input_variable')}
            placeholder="Select a string variable"
          />
        </Field>

        {/* Text with Variable Insertion */}
        <Field
          title="Message Template"
          tooltip="Use {{#variable#}} syntax to insert variables"
        >
          <InputSupportSelectVar
            nodeId={id}
            value={inputs.message_template || ''}
            onChange={handleFieldChange('message_template')}
            availableVars={availableVars}
            multiline
            rows={4}
            placeholder="Hello {{#user.name#}}, your ID is {{#user.id#}}"
          />
        </Field>

        {/* ========== SECTION 3: Conditional Rendering ========== */}
        <div className="text-sm font-semibold text-gray-700 border-b pb-2 mt-6">
          Conditional Fields (Based on Mode)
        </div>

        {/* Show different fields based on selected mode */}
        {inputs.mode === 'simple' && (
          <Field title="Quick Message">
            <Input
              value={inputs.quick_message || ''}
              onChange={handleFieldChange('quick_message')}
              placeholder="Enter a quick message"
            />
          </Field>
        )}

        {inputs.mode === 'advanced' && (
          <>
            <Field
              title="API URL"
              tooltip="Enter the API endpoint URL"
              required
            >
              <Input
                value={inputs.url || ''}
                onChange={handleUrlChange}
                placeholder="https://api.example.com/endpoint"
                className={errors.url ? 'border-red-500' : ''}
              />
              {errors.url && (
                <div className="text-xs text-red-500 mt-1">
                  {errors.url}
                </div>
              )}
            </Field>

            <Field title="HTTP Method">
              <Select
                value={inputs.http_method || 'GET'}
                onChange={handleFieldChange('http_method')}
                options={[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' }
                ]}
              />
            </Field>
          </>
        )}

        {inputs.mode === 'expert' && (
          <Field
            title="Custom Code"
            tooltip="Write custom Python code"
          >
            <CodeEditor
              value={inputs.custom_code || ''}
              onChange={handleFieldChange('custom_code')}
              language="python"
              height={300}
            />
          </Field>
        )}

        {/* ========== SECTION 4: Dynamic Lists ========== */}
        <div className="text-sm font-semibold text-gray-700 border-b pb-2 mt-6">
          Dynamic Lists
        </div>

        <Field
          title="Custom Items"
          tooltip="Add or remove items dynamically"
          operations={
            <Button
              size="sm"
              variant="primary"
              onClick={handleAddItem}
            >
              + Add Item
            </Button>
          }
        >
          <div className="space-y-2">
            {(inputs.custom_items || []).length === 0 && (
              <div className="text-sm text-gray-400 italic">
                No items yet. Click "Add Item" to begin.
              </div>
            )}
            {(inputs.custom_items || []).map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={item}
                  onChange={(value) => handleItemChange(index, value)}
                  placeholder={`Item ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Field>

        {/* ========== SECTION 5: Collapsible Sections ========== */}
        <div className="text-sm font-semibold text-gray-700 border-b pb-2 mt-6">
          Collapsible Sections
        </div>

        <Collapse title="Advanced Options" defaultOpen={false}>
          <div className="space-y-4 pt-4">
            <Field title="Timeout (seconds)">
              <Input
                type="number"
                value={inputs.timeout || 30}
                onChange={handleFieldChange('timeout')}
                placeholder="30"
              />
            </Field>

            <Field title="Retry Count">
              <Input
                type="number"
                value={inputs.retry_count || 3}
                onChange={handleFieldChange('retry_count')}
                placeholder="3"
              />
            </Field>

            <Field title="Enable Logging">
              <Switch
                value={inputs.enable_logging || false}
                onChange={handleFieldChange('enable_logging')}
              />
            </Field>
          </div>
        </Collapse>

        <Collapse title="Debug Information" defaultOpen={false}>
          <div className="pt-4">
            <div className="text-xs bg-gray-50 p-3 rounded border">
              <div className="font-semibold mb-2">Current Configuration:</div>
              <pre className="text-xs overflow-auto max-h-64">
                {JSON.stringify(inputs, null, 2)}
              </pre>
            </div>
          </div>
        </Collapse>

        {/* ========== Help Text ========== */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-semibold text-blue-900 mb-2">
            💡 Panel UI Patterns Demonstrated
          </div>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Basic inputs: text, textarea, select, switch, number slider</li>
            <li>Variable selection with type filtering</li>
            <li>Text input with variable insertion ({"{{#variable#}}"})</li>
            <li>Code editor with syntax highlighting</li>
            <li>Dynamic lists (add/remove items)</li>
            <li>Conditional rendering based on mode</li>
            <li>Collapsible sections</li>
            <li>Validation with error messages</li>
          </ul>
          <div className="mt-2 text-blue-700">
            See <code>conventions/panel-components.md</code> for complete component reference.
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(AdvancedPanelExamplePanel)
