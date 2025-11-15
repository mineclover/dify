/**
 * Core installation logic for dify-patcher
 */

import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import type { InstallOptions, InstallResult, SymlinkMap } from './types'
import {
  getInstallationPaths,
  validateDifyInstallation,
  createSymlink,
  copyDirectory,
  applyPatch,
} from './utils'

/**
 * Main installation function
 */
export async function install(options: InstallOptions): Promise<InstallResult> {
  const result: InstallResult = {
    success: false,
    mode: options.mode,
    symlinksCreated: 0,
    patchesApplied: 0,
    errors: [],
    warnings: [],
  }

  try {
    // Get patcher root (2 levels up from this file: cli/src -> cli -> installer -> root)
    const patcherRoot = path.resolve(__dirname, '../../..')
    const difyRoot = path.resolve(options.target)

    // Validate Dify installation
    const spinner = ora('Validating Dify installation...').start()

    const isValid = await validateDifyInstallation(difyRoot)
    if (!isValid) {
      spinner.fail('Invalid Dify installation')
      result.errors.push(`Not a valid Dify installation: ${difyRoot}`)
      result.errors.push('Expected directories: api/, web/, docker/')
      return result
    }

    spinner.succeed('Dify installation validated')

    // Get installation paths
    const paths = getInstallationPaths(patcherRoot, difyRoot)

    // Step 1: Create symlinks or copy files based on mode
    if (options.mode === 'dev') {
      await installDevMode(paths, options, result)
    } else {
      await installDockerMode(paths, options, result)
    }

    // Step 2: Apply patches (unless skipped)
    if (!options.skipPatches) {
      await applyPatches(paths, options, result)
    } else {
      if (options.verbose) {
        console.log(chalk.yellow('⊘ Skipping patches'))
      }
    }

    // Check if there were any errors
    if (result.errors.length === 0) {
      result.success = true
    }

    return result
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
    return result
  }
}

/**
 * Install in development mode (symlinks)
 */
async function installDevMode(
  paths: any,
  options: InstallOptions,
  result: InstallResult
): Promise<void> {
  const spinner = ora('Creating symlinks for development mode...').start()

  const symlinks: SymlinkMap[] = [
    {
      source: paths.nodesSource,
      target: paths.backendTarget,
      description: 'Backend custom nodes',
    },
    {
      source: paths.nodesSource,
      target: paths.frontendTarget,
      description: 'Frontend custom nodes',
    },
    {
      source: paths.sdkPythonSource,
      target: path.join(paths.difyRoot, 'api/core/dify_custom_nodes'),
      description: 'Python SDK',
    },
    {
      source: paths.sdkTypeScriptSource,
      target: path.join(paths.difyRoot, 'web/dify_custom_nodes_sdk'),
      description: 'TypeScript SDK',
    },
  ]

  let successCount = 0

  for (const link of symlinks) {
    const linkResult = await createSymlink(link.source, link.target, link.description, options.verbose)

    if (linkResult.success) {
      successCount++
    } else {
      result.errors.push(linkResult.error || 'Unknown error creating symlink')
      if (!options.force) {
        spinner.fail('Failed to create symlinks')
        return
      }
    }
  }

  result.symlinksCreated = successCount
  spinner.succeed(`Created ${successCount} symlink(s)`)
}

/**
 * Install in Docker mode (copy files)
 */
async function installDockerMode(
  paths: any,
  options: InstallOptions,
  result: InstallResult
): Promise<void> {
  const spinner = ora('Copying files for Docker mode...').start()

  const copies: SymlinkMap[] = [
    {
      source: paths.nodesSource,
      target: paths.backendTarget,
      description: 'Backend custom nodes',
    },
    {
      source: paths.nodesSource,
      target: paths.frontendTarget,
      description: 'Frontend custom nodes',
    },
    {
      source: paths.sdkPythonSource,
      target: path.join(paths.difyRoot, 'api/core/dify_custom_nodes'),
      description: 'Python SDK',
    },
    {
      source: paths.sdkTypeScriptSource,
      target: path.join(paths.difyRoot, 'web/dify_custom_nodes_sdk'),
      description: 'TypeScript SDK',
    },
  ]

  let successCount = 0

  for (const copy of copies) {
    const copyResult = await copyDirectory(copy.source, copy.target, copy.description, options.verbose)

    if (copyResult.success) {
      successCount++
    } else {
      result.errors.push(copyResult.error || 'Unknown error copying directory')
      if (!options.force) {
        spinner.fail('Failed to copy files')
        return
      }
    }
  }

  result.symlinksCreated = successCount // Reuse counter
  spinner.succeed(`Copied ${successCount} director(ies)`)
}

/**
 * Apply patches to Dify
 */
async function applyPatches(paths: any, options: InstallOptions, result: InstallResult): Promise<void> {
  const spinner = ora('Applying patches...').start()

  // Only apply the frontend auto-loader patch
  // Backend nodes are auto-discovered via decorator
  const patches = [
    {
      source: path.join(paths.patcherRoot, 'patches/001-custom-panel-loader.patch'),
      target: paths.difyRoot,
      description: 'Custom panel auto-loader',
    },
  ]

  let successCount = 0

  for (const patch of patches) {
    const patchResult = await applyPatch(patch.source, patch.target, patch.description, options.verbose)

    if (patchResult.success) {
      successCount++
    } else {
      // Check if patch file exists, if not it might be already applied manually
      const fs = require('fs-extra')
      if (!(await fs.pathExists(patch.source))) {
        result.warnings.push(`Patch file not found (might be already applied manually): ${patch.source}`)
      } else {
        result.warnings.push(patchResult.error || 'Unknown error applying patch')
      }
    }
  }

  result.patchesApplied = successCount

  if (successCount > 0) {
    spinner.succeed(`Applied ${successCount} patch(es)`)
  } else if (result.warnings.length > 0) {
    spinner.warn('No patches applied (check warnings)')
  } else {
    spinner.fail('Failed to apply patches')
  }
}

/**
 * Uninstall dify-patcher
 */
export async function uninstall(targetPath: string, verbose: boolean = false): Promise<boolean> {
  try {
    const spinner = ora('Removing dify-patcher installation...').start()

    const difyRoot = path.resolve(targetPath)
    const patcherRoot = path.resolve(__dirname, '../../..')
    const paths = getInstallationPaths(patcherRoot, difyRoot)

    const fs = require('fs-extra')

    // Remove symlinks or directories
    const targets = [
      paths.backendTarget,
      paths.frontendTarget,
      path.join(paths.difyRoot, 'api/core/dify_custom_nodes'),
      path.join(paths.difyRoot, 'web/dify_custom_nodes_sdk'),
    ]

    let removedCount = 0

    for (const target of targets) {
      if (await fs.pathExists(target)) {
        await fs.remove(target)
        removedCount++
        if (verbose) {
          console.log(chalk.gray(`  Removed: ${target}`))
        }
      }
    }

    spinner.succeed(`Removed ${removedCount} installation(s)`)

    console.log()
    console.log(chalk.yellow('Note: Patches are not automatically reverted.'))
    console.log(chalk.gray('To revert patches manually, use: git apply --reverse patches/*.patch'))
    console.log()

    return true
  } catch (error) {
    console.error(chalk.red('Uninstall failed:'), error)
    return false
  }
}
