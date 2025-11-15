/**
 * Weather API Node - Frontend Components
 *
 * This file exports the node and panel components for the Weather API node.
 */

import manifest from '../manifest.json'

export { WeatherAPINode as NodeComponent } from './node'
export { WeatherAPIPanel as PanelComponent } from './panel'
export { weatherAPIDefault as defaultConfig } from './default'
export { nodeType, manifest }

export const nodeType = manifest.node_type
