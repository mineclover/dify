/**
 * Dify Custom Nodes SDK - TypeScript/React
 *
 * A TypeScript SDK for developing custom workflow nodes for Dify with React components.
 *
 * @example
 * ```tsx
 * import { createNodeComponent, createPanelComponent, useConfig } from '@dify/custom-nodes-sdk'
 * import type { CustomNodeData, NodeProps, NodePanelProps } from '@dify/custom-nodes-sdk'
 *
 * interface MyNodeData extends CustomNodeData {
 *   myField: string
 * }
 *
 * export const MyNode = createNodeComponent<MyNodeData>((props) => {
 *   const { data } = props
 *   return <div>{data.myField}</div>
 * })
 *
 * export const MyPanel = createPanelComponent<MyNodeData>((props) => {
 *   const { id, data } = props
 *   const { inputs, handleFieldChange } = useConfig(id, data)
 *
 *   return (
 *     <Field title="My Field">
 *       <Input value={inputs.myField} onChange={handleFieldChange('myField')} />
 *     </Field>
 *   )
 * })
 * ```
 */

// Components
export { BaseNode, createNodeComponent } from './base-node'
export type { BaseNodeProps } from './base-node'

export { BasePanel, createPanelComponent } from './base-panel'
export type { BasePanelProps } from './base-panel'

// Hooks
export { useConfig, createUseConfig } from './use-config'

// Types
export type {
  CustomNodeData,
  CustomNodeManifest,
  InputSchema,
  OutputSchema,
  NodeProps,
  NodePanelProps,
  NodeComponent,
  PanelComponent,
  NodeDefault,
  ValidationResult,
  OutputVar,
  UseConfigReturn,
  NodeRegistration,
} from './types'

export { VarType, InputVarType } from './types'

// Version
export const VERSION = '0.1.0'
