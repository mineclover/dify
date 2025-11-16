#!/usr/bin/env node

/**
 * Dify Custom Nodes Patcher - Interactive Installer CLI
 *
 * A cross-platform installer tool for dify-patcher custom nodes
 */

import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import path from 'path'
import { install, uninstall } from './installer'
import type { InstallOptions, InstallMode } from './types'
import { printBanner, printSuccess, printError, validateDifyInstallation, resolvePath } from './utils'

const program = new Command()

program
  .name('dify-install')
  .description('Interactive installer for dify-patcher custom nodes')
  .version('1.0.0')

/**
 * Install command
 */
program
  .command('install')
  .description('Install dify-patcher to a Dify installation')
  .option('-t, --target <path>', 'Path to Dify installation directory')
  .option('-m, --mode <mode>', 'Installation mode (dev|docker)')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--skip-patches', 'Skip applying patches', false)
  .option('-f, --force', 'Force installation even on errors', false)
  .option('-y, --yes', 'Skip interactive prompts and use defaults', false)
  .action(async (options) => {
    try {
      printBanner()

      let installOptions: InstallOptions

      // Interactive mode
      if (!options.yes && (!options.target || !options.mode)) {
        installOptions = await promptInstallOptions(options)
      } else {
        // Non-interactive mode
        if (!options.target) {
          console.error(chalk.red('Error: --target is required in non-interactive mode'))
          process.exit(1)
        }

        if (!options.mode) {
          console.error(chalk.red('Error: --mode is required in non-interactive mode'))
          process.exit(1)
        }

        installOptions = {
          target: options.target,
          mode: options.mode as InstallMode,
          verbose: options.verbose || false,
          skipPatches: options.skipPatches || false,
          force: options.force || false,
        }
      }

      // Validate mode
      if (!['dev', 'docker'].includes(installOptions.mode)) {
        console.error(chalk.red('Error: mode must be either "dev" or "docker"'))
        process.exit(1)
      }

      // Run installation
      const result = await install(installOptions)

      if (result.success) {
        printSuccess(result.mode, result.symlinksCreated, result.patchesApplied)

        if (result.warnings.length > 0) {
          console.log(chalk.bold.yellow('Warnings:'))
          result.warnings.forEach((warning) => {
            console.log(chalk.yellow(`  • ${warning}`))
          })
          console.log()
        }

        process.exit(0)
      } else {
        printError('Installation encountered errors', result.errors)
        process.exit(1)
      }
    } catch (error) {
      console.error(chalk.red('Fatal error:'), error)
      process.exit(1)
    }
  })

/**
 * Uninstall command
 */
program
  .command('uninstall')
  .description('Remove dify-patcher from a Dify installation')
  .option('-t, --target <path>', 'Path to Dify installation directory')
  .option('-v, --verbose', 'Verbose output', false)
  .option('-y, --yes', 'Skip confirmation prompt', false)
  .action(async (options) => {
    try {
      printBanner()

      let targetPath = options.target

      // Prompt for target if not provided
      if (!targetPath) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'target',
            message: 'Path to Dify installation (supports ~, relative, and absolute paths):',
            default: '../dify',
            validate: async (input: string) => {
              const resolvedPath = resolvePath(input)
              const isValid = await validateDifyInstallation(resolvedPath)
              return isValid || 'Not a valid Dify installation'
            },
          },
        ])
        targetPath = answers.target
      }

      // Confirm uninstallation
      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: chalk.yellow('Are you sure you want to uninstall dify-patcher?'),
            default: false,
          },
        ])

        if (!confirm) {
          console.log(chalk.gray('Uninstall cancelled'))
          process.exit(0)
        }
      }

      const success = await uninstall(targetPath, options.verbose)

      if (success) {
        console.log(chalk.green('✓ Uninstall completed successfully'))
        process.exit(0)
      } else {
        console.log(chalk.red('✗ Uninstall failed'))
        process.exit(1)
      }
    } catch (error) {
      console.error(chalk.red('Fatal error:'), error)
      process.exit(1)
    }
  })

/**
 * Info command - show current installation status
 */
program
  .command('info')
  .description('Show information about current installation')
  .option('-t, --target <path>', 'Path to Dify installation directory', '../dify')
  .action(async (options) => {
    try {
      const fs = require('fs-extra')
      const difyRoot = resolvePath(options.target)

      printBanner()

      console.log(chalk.bold('Installation Information'))
      console.log()
      console.log(chalk.gray('  Dify path:'), chalk.cyan(difyRoot))

      // Check if valid Dify installation
      const isValid = await validateDifyInstallation(difyRoot)
      console.log(chalk.gray('  Valid Dify:'), isValid ? chalk.green('Yes') : chalk.red('No'))

      if (!isValid) {
        process.exit(0)
      }

      // Check for custom nodes
      const backendPath = path.join(difyRoot, 'api/core/workflow/nodes/_custom')
      const frontendPath = path.join(difyRoot, 'web/app/components/workflow/nodes/_custom')

      const backendExists = await fs.pathExists(backendPath)
      const frontendExists = await fs.pathExists(frontendPath)

      console.log(chalk.gray('  Backend custom nodes:'), backendExists ? chalk.green('Installed') : chalk.yellow('Not found'))
      console.log(chalk.gray('  Frontend custom nodes:'), frontendExists ? chalk.green('Installed') : chalk.yellow('Not found'))

      // Check if symlinks or copies
      if (backendExists) {
        const backendStats = await fs.lstat(backendPath)
        const isSymlink = backendStats.isSymbolicLink()
        console.log(chalk.gray('  Installation mode:'), isSymlink ? chalk.cyan('dev (symlink)') : chalk.cyan('docker (copy)'))
      }

      console.log()
    } catch (error) {
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  })

/**
 * Prompt for installation options
 */
async function promptInstallOptions(cliOptions: any): Promise<InstallOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'target',
      message: 'Path to Dify installation (supports ~, relative, and absolute paths):',
      default: cliOptions.target || '../dify',
      when: !cliOptions.target,
      validate: async (input: string) => {
        const resolvedPath = resolvePath(input)
        const isValid = await validateDifyInstallation(resolvedPath)
        return isValid || 'Not a valid Dify installation. Expected directories: api/, web/, docker/'
      },
    },
    {
      type: 'list',
      name: 'mode',
      message: 'Installation mode:',
      choices: [
        {
          name: 'Development (symlinks for hot reload)',
          value: 'dev',
        },
        {
          name: 'Docker (copy files)',
          value: 'docker',
        },
      ],
      default: cliOptions.mode || 'dev',
      when: !cliOptions.mode,
    },
    {
      type: 'confirm',
      name: 'skipPatches',
      message: 'Skip applying patches?',
      default: cliOptions.skipPatches || false,
      when: cliOptions.skipPatches === undefined,
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: 'Enable verbose output?',
      default: cliOptions.verbose || false,
      when: cliOptions.verbose === undefined,
    },
  ])

  return {
    target: cliOptions.target || answers.target,
    mode: (cliOptions.mode || answers.mode) as InstallMode,
    verbose: cliOptions.verbose !== undefined ? cliOptions.verbose : answers.verbose,
    skipPatches: cliOptions.skipPatches !== undefined ? cliOptions.skipPatches : answers.skipPatches,
    force: cliOptions.force || false,
  }
}

// Parse command line arguments
program.parse()

// Show help if no command provided
if (!process.argv.slice(2).length) {
  printBanner()
  program.outputHelp()
}
