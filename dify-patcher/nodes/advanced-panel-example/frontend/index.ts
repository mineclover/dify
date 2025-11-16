/**
 * Advanced Panel Example Node - Frontend Components
 */

import manifest from '../manifest.json'

export { AdvancedPanelExampleNode as NodeComponent } from './node'
export { AdvancedPanelExamplePanel as PanelComponent } from './panel'
export { advancedPanelExampleDefault as defaultConfig } from './default'

export const nodeType = manifest.node_type
export { manifest }
