/**
 * Type definitions for Advanced Panel Example Node
 */

import type { CustomNodeData } from '../../../sdk/typescript/src/types'

export interface AdvancedPanelExampleNodeData extends CustomNodeData {
  type: 'advanced-panel-example'

  // Basic fields
  name?: string
  description?: string
  mode?: 'simple' | 'advanced' | 'expert'
  enable_feature?: boolean
  confidence?: number

  // Variable fields
  input_variable?: string[]
  message_template?: string

  // Conditional fields
  quick_message?: string  // For simple mode
  url?: string            // For advanced mode
  http_method?: string    // For advanced mode
  custom_code?: string    // For expert mode

  // Dynamic list
  custom_items?: string[]

  // Advanced options (collapsible)
  timeout?: number
  retry_count?: number
  enable_logging?: boolean
}
