/**
 * Test Node Node - Frontend Components
 */

import manifest from '../manifest.json'

export { TestNodeNode as NodeComponent } from './node'
export { TestNodePanel as PanelComponent } from './panel'
export { testNodeDefault as defaultConfig } from './default'

export const nodeType = manifest.node_type
export { manifest }
