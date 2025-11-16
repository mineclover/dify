/**
 * Default configuration for Weather API Node
 */

import type { NodeDefault, ValidationResult } from '../../../sdk/typescript/src/types'
import { VarType } from '../../../sdk/typescript/src/types'
import type { WeatherAPINodeData } from './types'

export const weatherAPIDefault: NodeDefault<WeatherAPINodeData> = {
  defaultValue: {
    title: 'Weather API',
    desc: 'Fetch weather data',
    type: 'weather-api',
    city: '',
    api_key: '',
    units: 'metric',
  },

  checkValid(payload: WeatherAPINodeData, t: any): ValidationResult {
    if (!payload.city || payload.city.trim() === '') {
      return {
        isValid: false,
        errorMessage: t?.('workflow.nodes.weatherAPI.cityRequired') || 'City name is required',
      }
    }

    if (!payload.api_key || payload.api_key.trim() === '') {
      return {
        isValid: false,
        errorMessage: t?.('workflow.nodes.weatherAPI.apiKeyRequired') || 'API key is required',
      }
    }

    return {
      isValid: true,
    }
  },

  getOutputVars(payload: WeatherAPINodeData) {
    return [
      {
        variable: 'temperature',
        type: VarType.Number,
        description: 'Current temperature',
      },
      {
        variable: 'feels_like',
        type: VarType.Number,
        description: 'Feels like temperature',
      },
      {
        variable: 'humidity',
        type: VarType.Number,
        description: 'Humidity percentage',
      },
      {
        variable: 'description',
        type: VarType.String,
        description: 'Weather description',
      },
      {
        variable: 'weather_data',
        type: VarType.Object,
        description: 'Full weather data object',
      },
    ]
  },
}
