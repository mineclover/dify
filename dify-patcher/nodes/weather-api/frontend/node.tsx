/**
 * Weather API Node - Canvas Component
 *
 * This is the small UI displayed on the workflow canvas.
 */

import React from 'react'
import type { FC } from 'react'
import type { NodeProps } from '../../../sdk/typescript/src/types'
import type { WeatherAPINodeData } from './types'

export const WeatherAPINode: FC<NodeProps<WeatherAPINodeData>> = ({ data }) => {
  const { city, units } = data

  if (!city) return null

  const unitSymbol = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K'

  return (
    <div className="mb-1 px-3 py-1">
      <div className="flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-900/20 p-2">
        <div className="text-2xl">☁️</div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {city}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Temperature in {unitSymbol}
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(WeatherAPINode)
