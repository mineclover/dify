/**
 * Weather API Node - Configuration Panel
 *
 * This is the configuration UI shown in the right sidebar.
 */

import React from 'react'
import type { FC } from 'react'
import { useConfig } from './use-config'
import type { NodePanelProps } from '../../../sdk/typescript/src/types'
import type { WeatherAPINodeData } from './types'

/**
 * These components should be imported from Dify's component library
 * For now, we'll use placeholder interfaces
 */
interface FieldProps {
  title: string
  children: React.ReactNode
}

const Field: FC<FieldProps> = ({ title, children }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {title}
    </label>
    {children}
  </div>
)

interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}

const Input: FC<InputProps> = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
  />
)

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

const Select: FC<SelectProps> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
)

export const WeatherAPIPanel: FC<NodePanelProps<WeatherAPINodeData>> = ({ id, data }) => {
  const { inputs, handleFieldChange, readOnly } = useConfig(id, data)

  return (
    <div className="mt-2">
      <div className="space-y-4 px-4 pb-4">
        <Field title="City Name">
          <Input
            value={inputs.city || ''}
            onChange={handleFieldChange('city')}
            placeholder="e.g., London, Tokyo, New York"
          />
        </Field>

        <Field title="API Key">
          <Input
            type="password"
            value={inputs.api_key || ''}
            onChange={handleFieldChange('api_key')}
            placeholder="Enter your OpenWeatherMap API key"
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Get your free API key from{' '}
            <a
              href="https://openweathermap.org/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              openweathermap.org
            </a>
          </div>
        </Field>

        <Field title="Temperature Units">
          <Select
            value={inputs.units || 'metric'}
            onChange={handleFieldChange('units')}
            options={[
              { value: 'metric', label: 'Metric (°C)' },
              { value: 'imperial', label: 'Imperial (°F)' },
              { value: 'standard', label: 'Standard (K)' },
            ]}
          />
        </Field>

        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            📊 Output Variables
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <div>• <code>temperature</code> - Current temperature</div>
            <div>• <code>feels_like</code> - Feels like temperature</div>
            <div>• <code>humidity</code> - Humidity percentage</div>
            <div>• <code>description</code> - Weather description</div>
            <div>• <code>weather_data</code> - Full weather object</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(WeatherAPIPanel)
