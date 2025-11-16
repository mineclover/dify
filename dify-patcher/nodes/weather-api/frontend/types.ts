/**
 * Type definitions for Weather API Node
 */

import type { CustomNodeData } from '../../../sdk/typescript/src/types'

export interface WeatherAPINodeData extends CustomNodeData {
  type: 'weather-api'
  city: string
  api_key: string
  units: 'metric' | 'imperial' | 'standard'
}
