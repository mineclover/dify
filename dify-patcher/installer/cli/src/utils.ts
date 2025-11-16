/**
 * Utility functions for dify-patcher installer
 */

import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import chalk from 'chalk'
import type { InstallationPaths, InstallMode } from './types'

/**
 * Expand tilde (~) in path to home directory
 */
export function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1))
  }
  return filePath
}

/**
 * Resolve and normalize a path (supports ~, relative, and absolute paths)
 */
export function resolvePath(inputPath: string): string {
  // Expand tilde first
  const expandedPath = expandTilde(inputPath)

  // Resolve to absolute path
  const absolutePath = path.resolve(expandedPath)

  // Normalize (handle .. and . and multiple slashes)
  return path.normalize(absolutePath)
}

/**
 * Check if a directory exists and is a Dify installation
 */
export async function validateDifyInstallation(difyPath: string): Promise<boolean> {
  try {
    // Resolve path first
    const resolvedPath = resolvePath(difyPath)

    // Check for key Dify directories
    const apiPath = path.join(resolvedPath, 'api')
    const webPath = path.join(resolvedPath, 'web')
    const dockerPath = path.join(resolvedPath, 'docker')

    const [apiExists, webExists, dockerExists] = await Promise.all([
      fs.pathExists(apiPath),
      fs.pathExists(webPath),
      fs.pathExists(dockerPath),
    ])

    return apiExists && webExists && dockerExists
  } catch (error) {
    return false
  }
}

/**
 * Get installation paths based on target directory
 */
export function getInstallationPaths(patcherRoot: string, difyRoot: string): InstallationPaths {
  // Ensure all paths are absolute
  const resolvedPatcherRoot = resolvePath(patcherRoot)
  const resolvedDifyRoot = resolvePath(difyRoot)

  return {
    patcherRoot: resolvedPatcherRoot,
    difyRoot: resolvedDifyRoot,
    backendTarget: path.join(resolvedDifyRoot, 'api/core/workflow/nodes/_custom'),
    frontendTarget: path.join(resolvedDifyRoot, 'web/app/components/workflow/nodes/_custom'),
    nodesSource: path.join(resolvedPatcherRoot, 'nodes'),
    sdkPythonSource: path.join(resolvedPatcherRoot, 'sdk/python/dify_custom_nodes'),
    sdkTypeScriptSource: path.join(resolvedPatcherRoot, 'sdk/typescript'),
  }
}

/**
 * Create a symlink with proper error handling
 *
 * Note: Always uses absolute paths for both source and target to ensure
 * the symlink works correctly regardless of where it's accessed from.
 */
export async function createSymlink(
  source: string,
  target: string,
  description: string,
  verbose: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure both paths are absolute
    const absoluteSource = path.isAbsolute(source) ? source : path.resolve(source)
    const absoluteTarget = path.isAbsolute(target) ? target : path.resolve(target)

    // Check if source exists
    if (!(await fs.pathExists(absoluteSource))) {
      return {
        success: false,
        error: `Source does not exist: ${absoluteSource}`,
      }
    }

    // Remove existing target if it exists
    if (await fs.pathExists(absoluteTarget)) {
      const stats = await fs.lstat(absoluteTarget)
      if (stats.isSymbolicLink()) {
        await fs.remove(absoluteTarget)
        if (verbose) {
          console.log(chalk.yellow(`  Removed existing symlink: ${absoluteTarget}`))
        }
      } else {
        return {
          success: false,
          error: `Target exists and is not a symlink: ${absoluteTarget}`,
        }
      }
    }

    // Ensure parent directory exists
    await fs.ensureDir(path.dirname(absoluteTarget))

    // Create symlink with absolute source path
    // This ensures the symlink works from any directory
    await fs.symlink(absoluteSource, absoluteTarget, 'dir')

    if (verbose) {
      console.log(chalk.green(`  ✓ ${description}`))
      console.log(chalk.gray(`    ${absoluteSource} → ${absoluteTarget}`))
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Copy directory recursively
 */
export async function copyDirectory(
  source: string,
  target: string,
  description: string,
  verbose: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if source exists
    if (!(await fs.pathExists(source))) {
      return {
        success: false,
        error: `Source does not exist: ${source}`,
      }
    }

    // Remove existing target if force option
    if (await fs.pathExists(target)) {
      await fs.remove(target)
      if (verbose) {
        console.log(chalk.yellow(`  Removed existing directory: ${target}`))
      }
    }

    // Copy directory
    await fs.copy(source, target, {
      overwrite: true,
      errorOnExist: false,
    })

    if (verbose) {
      console.log(chalk.green(`  ✓ ${description}`))
      console.log(chalk.gray(`    ${source} → ${target}`))
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Apply a patch file using git apply
 */
export async function applyPatch(
  patchPath: string,
  targetDir: string,
  description: string,
  verbose: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const { execSync } = require('child_process')

    if (!(await fs.pathExists(patchPath))) {
      return {
        success: false,
        error: `Patch file does not exist: ${patchPath}`,
      }
    }

    // Try to apply patch
    try {
      execSync(`git apply "${patchPath}"`, {
        cwd: targetDir,
        stdio: verbose ? 'inherit' : 'pipe',
      })

      if (verbose) {
        console.log(chalk.green(`  ✓ ${description}`))
      }

      return { success: true }
    } catch (error) {
      // Patch might already be applied, check if it can be reversed
      try {
        execSync(`git apply --reverse --check "${patchPath}"`, {
          cwd: targetDir,
          stdio: 'pipe',
        })

        // Patch is already applied
        if (verbose) {
          console.log(chalk.yellow(`  ⊘ ${description} (already applied)`))
        }

        return { success: true }
      } catch {
        // Patch failed and is not already applied
        return {
          success: false,
          error: `Failed to apply patch: ${patchPath}`,
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return process.platform === 'win32'
}

/**
 * Format file path for display
 */
export function formatPath(filePath: string): string {
  return chalk.cyan(path.relative(process.cwd(), filePath))
}

/**
 * Print a banner
 */
export function printBanner(): void {
  console.log()
  console.log(chalk.bold.blue('╔═══════════════════════════════════════════════════════════╗'))
  console.log(chalk.bold.blue('║                                                           ║'))
  console.log(chalk.bold.blue('║           Dify Custom Nodes Patcher Installer            ║'))
  console.log(chalk.bold.blue('║                                                           ║'))
  console.log(chalk.bold.blue('╚═══════════════════════════════════════════════════════════╝'))
  console.log()
}

/**
 * Print success message
 */
export function printSuccess(mode: InstallMode, symlinksCreated: number, patchesApplied: number): void {
  console.log()
  console.log(chalk.bold.green('✓ Installation completed successfully!'))
  console.log()
  console.log(chalk.gray('  Mode:'), chalk.cyan(mode))
  console.log(chalk.gray('  Symlinks created:'), chalk.yellow(symlinksCreated))
  console.log(chalk.gray('  Patches applied:'), chalk.yellow(patchesApplied))
  console.log()

  if (mode === 'docker') {
    console.log(chalk.bold.yellow('Next steps:'))
    console.log(chalk.gray('  1. Add to docker/.env:'), chalk.cyan('CUSTOM_NODES_ENABLED=true'))
    console.log(chalk.gray('  2. Restart containers:'), chalk.cyan('docker-compose restart'))
  } else {
    console.log(chalk.bold.yellow('Next steps:'))
    console.log(chalk.gray('  1. Add to .env:'), chalk.cyan('CUSTOM_NODES_ENABLED=true'))
    console.log(chalk.gray('  2. Add to web/.env.local:'), chalk.cyan('NEXT_PUBLIC_CUSTOM_NODES_ENABLED=true'))
    console.log(chalk.gray('  3. Restart Dify services'))
  }

  console.log()
}

/**
 * Print error message
 */
export function printError(message: string, errors: string[]): void {
  console.log()
  console.log(chalk.bold.red('✗ Installation failed'))
  console.log()
  console.log(chalk.red(message))

  if (errors.length > 0) {
    console.log()
    console.log(chalk.bold.red('Errors:'))
    errors.forEach((error) => {
      console.log(chalk.red(`  • ${error}`))
    })
  }

  console.log()
}
