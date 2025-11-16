/**
 * Type definitions for Dify custom nodes (TypeScript/React)
 *
 * This module re-exports Dify's core types and provides compatibility
 * layer for custom nodes. When dify-patcher is used as a submodule,
 * it imports types from the parent Dify repository via path mapping.
 */

import type { Node as ReactFlowNode } from 'reactflow'

// ============================================================================
// Dify Core Types (Re-export)
// ============================================================================

// Import from Dify when available, fallback to local definitions
// Path mapping configured in tsconfig.json:
// "@dify/types" -> "../dify/web/app/components/workflow/types"
// "@dify/types/workflow" -> "../dify/web/types/workflow"

// Note: These imports work when dify-patcher is used as submodule
// For standalone usage, types are defined locally below
export type {
  CommonNodeType,
  NodePanelProps as DifyNodePanelProps,
  NodeProps as DifyNodeProps,
  Node,
  BlockEnum,
} from '@dify/types'

export type {
  PanelProps,
} from '@dify/types/workflow'

// ============================================================================
// Variable Types
// ============================================================================

export enum VarType {
  String = 'string',
  Number = 'number',
  Integer = 'integer',
  Secret = 'secret',
  Boolean = 'boolean',
  Object = 'object',
  File = 'file',
  Array = 'array',
  ArrayString = 'array[string]',
  ArrayNumber = 'array[number]',
  ArrayObject = 'array[object]',
  ArrayFile = 'array[file]',
}

export enum InputVarType {
  TextInput = 'text-input',
  Paragraph = 'paragraph',
  Select = 'select',
  Number = 'number',
  Checkbox = 'checkbox',
  Url = 'url',
  Files = 'files',
  Json = 'json',
}

// ============================================================================
// Node Configuration (Custom Node Manifest)
// ============================================================================

export interface CustomNodeManifest {
  node_type: string
  version: string
  name: string
  description: string
  author?: string
  icon?: string
  category?: string
  inputs?: Record<string, InputSchema>
  outputs?: Record<string, OutputSchema>
}

export interface InputSchema {
  type: string
  title: string
  description?: string
  required?: boolean
  default?: any
  enum?: any[]
  format?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
}

export interface OutputSchema {
  type: VarType
  description?: string
}

// ============================================================================
// Node Data Types (Compatibility Layer)
// ============================================================================

/**
 * CustomNodeData extends Dify's CommonNodeType
 * This is the recommended type for custom node data
 *
 * @example
 * export interface MyNodeData extends CustomNodeData {
 *   type: 'my-node'
 *   myField: string
 * }
 */
export interface CustomNodeData {
  // Core required fields
  title: string
  desc: string
  type: string

  // Optional UI state
  selected?: boolean
  width?: number
  height?: number

  // Connection state (managed by Dify)
  _connectedSourceHandleIds?: string[]
  _connectedTargetHandleIds?: string[]

  // Runtime state (managed by Dify)
  _runningStatus?: 'running' | 'succeeded' | 'failed'
  _isSingleRun?: boolean
  _singleRunningStatus?: 'running' | 'succeeded' | 'failed'

  // Allow additional custom fields
  [key: string]: any
}

// ============================================================================
// Node Props (Compatibility Layer)
// ============================================================================

/**
 * Props for custom node components
 * Compatible with Dify's NodeProps but simplified
 */
export interface NodeProps<T extends CustomNodeData = CustomNodeData> {
  id: string
  data: T
  selected?: boolean
}

/**
 * Props for custom node panel components
 * Compatible with Dify's NodePanelProps but simplified for standalone usage
 * When integrated with Dify, use DifyNodePanelProps instead
 */
export interface NodePanelProps<T extends CustomNodeData = CustomNodeData> {
  id: string
  data: T
  panelProps?: any // PanelProps from Dify, optional for standalone usage
}

// ============================================================================
// Node Configuration Hook
// ============================================================================

export interface UseConfigReturn<T extends CustomNodeData> {
  inputs: T
  readOnly: boolean
  handleFieldChange: (field: keyof T) => (value: any) => void
  handleBulkChange: (changes: Partial<T>) => void
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errorMessage?: string
}

// ============================================================================
// Output Variables
// ============================================================================

export interface OutputVar {
  variable: string
  type: VarType
  description?: string
}

// ============================================================================
// Node Default Configuration
// ============================================================================

export interface NodeDefault<T extends CustomNodeData> {
  /**
   * Default values for new nodes
   */
  defaultValue: Partial<T>

  /**
   * Validate node configuration
   */
  checkValid: (payload: T, t: any) => ValidationResult

  /**
   * Get output variables (can be dynamic based on config)
   */
  getOutputVars: (payload: T) => OutputVar[]
}

// ============================================================================
// Component Types
// ============================================================================

export interface NodeComponent<T extends CustomNodeData = CustomNodeData> {
  (props: NodeProps<T>): JSX.Element
}

export interface PanelComponent<T extends CustomNodeData = CustomNodeData> {
  (props: NodePanelProps<T>): JSX.Element
}

// ============================================================================
// Registration
// ============================================================================

export interface NodeRegistration<T extends CustomNodeData = CustomNodeData> {
  nodeType: string
  NodeComponent: NodeComponent<T>
  PanelComponent: PanelComponent<T>
  manifest: CustomNodeManifest
  defaultConfig: NodeDefault<T>
}
