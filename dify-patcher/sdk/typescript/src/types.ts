/**
 * Type definitions for Dify custom nodes (TypeScript/React)
 */

import type { Node as ReactFlowNode } from 'reactflow'

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
// Node Configuration
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
// Node Data Types
// ============================================================================

export interface BaseNodeData {
  title: string
  desc: string
  type: string
  selected?: boolean
  width?: number
  height?: number
  _connectedSourceHandleIds?: string[]
  _connectedTargetHandleIds?: string[]
  _runningStatus?: 'running' | 'succeeded' | 'failed'
  _isSingleRun?: boolean
  _singleRunningStatus?: 'running' | 'succeeded' | 'failed'
}

export interface CustomNodeData extends BaseNodeData {
  [key: string]: any
}

// ============================================================================
// Node Props
// ============================================================================

export interface NodeProps<T extends CustomNodeData = CustomNodeData> {
  id: string
  data: T
  selected?: boolean
}

export interface NodePanelProps<T extends CustomNodeData = CustomNodeData> {
  id: string
  data: T
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
