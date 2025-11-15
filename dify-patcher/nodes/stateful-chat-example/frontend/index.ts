/**
 * Stateful Chat Example Node - Frontend Components
 */

import manifest from '../manifest.json'

export { StatefulChatExampleNode as NodeComponent } from './node'
export { StatefulChatExamplePanel as PanelComponent } from './panel'
export { statefulChatExampleDefault as defaultConfig } from './default'

export const nodeType = manifest.node_type
export { manifest }
