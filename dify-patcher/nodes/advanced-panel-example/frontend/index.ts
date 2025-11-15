/**
 * Advanced Panel Example Node - Frontend Components
 */

import manifest from '../manifest.json'

export { AdvancedPanelExampleNode as NodeComponent } from './node'
export { AdvancedPanelExamplePanel as PanelComponent } from './panel'
export { advanced-panel-exampleDefault as defaultConfig } from './default'
export { nodeType, manifest }

export const nodeType = manifest.node_type
