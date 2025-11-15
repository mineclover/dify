/**
 * Agno Agent Node - Frontend Components
 */

import manifest from '../manifest.json'

export { AgnoAgentNode as NodeComponent } from './node'
export { AgnoAgentPanel as PanelComponent } from './panel'
export { agnoAgentDefault as defaultConfig } from './default'

export const nodeType = manifest.node_type
export { manifest }
