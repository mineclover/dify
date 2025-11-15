/**
 * Type definitions for dify-patcher installer
 */

export type InstallMode = 'dev' | 'docker'

export interface InstallOptions {
  target: string
  mode: InstallMode
  verbose?: boolean
  skipPatches?: boolean
  force?: boolean
}

export interface PatchFile {
  source: string
  target: string
  description: string
}

export interface SymlinkMap {
  source: string
  target: string
  description: string
}

export interface InstallResult {
  success: boolean
  mode: InstallMode
  symlinksCreated: number
  patchesApplied: number
  errors: string[]
  warnings: string[]
}

export interface InstallationPaths {
  patcherRoot: string
  difyRoot: string
  backendTarget: string
  frontendTarget: string
  nodesSource: string
  sdkPythonSource: string
  sdkTypeScriptSource: string
}
