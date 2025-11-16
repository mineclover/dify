/**
 * Type definitions for Test Node Node
 */

import type { CustomNodeData } from '../../../sdk/typescript/src/types'

export interface TestNodeNodeData extends CustomNodeData {
  type: 'test-node'
  input_text: string
}
