/**
 * Default configuration for Test Node Node
 */

import type { NodeDefault, ValidationResult } from '../../../sdk/typescript/src/types'
import { VarType } from '../../../sdk/typescript/src/types'
import type { TestNodeNodeData } from './types'

export const test-nodeDefault: NodeDefault<TestNodeNodeData> = {
  defaultValue: {
    title: 'Test Node',
    desc: 'Custom node',
    type: 'test-node',
    input_text: '',
  },

  checkValid(payload: TestNodeNodeData, t: any): ValidationResult {
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

  getOutputVars(payload: TestNodeNodeData) {
    return [
      {
        variable: 'output_text',
        type: VarType.String,
        description: 'Sample output',
      },
    ]
  },
}
