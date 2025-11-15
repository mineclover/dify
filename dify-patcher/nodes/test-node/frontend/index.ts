/**
 * Test Node Node - Frontend Components
 */

import manifest from '../manifest.json'

export { TestNodeNode as NodeComponent } from './node'
export { TestNodePanel as PanelComponent } from './panel'
export { test-nodeDefault as defaultConfig } from './default'
export { nodeType, manifest }

export const nodeType = manifest.node_type
