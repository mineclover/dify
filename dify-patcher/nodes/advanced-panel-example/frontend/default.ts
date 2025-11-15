/**
 * Default configuration for Advanced Panel Example Node
 */

import type { NodeDefault, ValidationResult } from '../../../sdk/typescript/src/types'
import { VarType } from '../../../sdk/typescript/src/types'
import type { AdvancedPanelExampleNodeData } from './types'

export const advancedPanelExampleDefault: NodeDefault<AdvancedPanelExampleNodeData> = {
  defaultValue: {
    title: 'Advanced Panel Example',
    desc: 'Custom node',
    type: 'advanced-panel-example',
    input_text: '',
  },

  checkValid(payload: AdvancedPanelExampleNodeData, t: any): ValidationResult {
    if (!payload.input_text || payload.input_text.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Input text is required',
      }
    }

    return {
      isValid: true,
    }
  },

  getOutputVars(payload: AdvancedPanelExampleNodeData) {
    return [
      {
        variable: 'output_text',
        type: VarType.String,
        description: 'Sample output',
      },
    ]
  },
}
