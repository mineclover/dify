# Dify Custom Nodes Patcher - Installer CLI

Interactive, cross-platform installer for dify-patcher custom nodes.

## Features

- ✅ **Interactive CLI** - User-friendly prompts with validation
- ✅ **Cross-Platform** - Works on Windows, macOS, and Linux
- ✅ **Progress Indicators** - Visual feedback with spinners and colors
- ✅ **Multiple Modes** - Development (symlinks) or Docker (copy files)
- ✅ **Type-Safe** - Written in TypeScript with full type definitions
- ✅ **Error Handling** - Comprehensive error messages and recovery
- ✅ **Uninstall Support** - Clean removal of installed components

## Installation

### From NPM (Recommended)

```bash
npm install -g @dify-patcher/installer
```

### From Source

```bash
cd installer/cli
npm install
npm run build
npm link
```

## Usage

### Interactive Mode

The easiest way to use the installer:

```bash
dify-install install
```

You'll be prompted for:
- Path to Dify installation
- Installation mode (dev/docker)
- Options (verbose, skip patches, etc.)

### Non-Interactive Mode

For CI/CD or scripting:

```bash
# Development mode
dify-install install --target ../dify --mode dev

# Docker mode
dify-install install --target ../dify --mode docker --yes

# With options
dify-install install -t ../dify -m dev --verbose --skip-patches
```

### Commands

#### Install

```bash
dify-install install [options]
```

**Options:**
- `-t, --target <path>` - Path to Dify installation
- `-m, --mode <mode>` - Installation mode (dev|docker)
- `-v, --verbose` - Verbose output
- `--skip-patches` - Skip applying patches
- `-f, --force` - Force installation even on errors
- `-y, --yes` - Skip interactive prompts

**Example:**
```bash
dify-install install -t /path/to/dify -m dev --verbose
```

#### Uninstall

```bash
dify-install uninstall [options]
```

**Options:**
- `-t, --target <path>` - Path to Dify installation
- `-v, --verbose` - Verbose output
- `-y, --yes` - Skip confirmation prompt

**Example:**
```bash
dify-install uninstall -t /path/to/dify
```

#### Info

Show current installation status:

```bash
dify-install info [options]
```

**Options:**
- `-t, --target <path>` - Path to Dify installation (default: ../dify)

**Example:**
```bash
dify-install info -t /path/to/dify
```

## Installation Modes

### Development Mode (`dev`)

Uses symlinks for hot reload during development:

- ✅ Changes reflect immediately without reinstalling
- ✅ Perfect for active development
- ✅ No need to rebuild after changes
- ❌ Requires symlink support (not available in some Docker setups)

```bash
dify-install install -m dev
```

### Docker Mode (`docker`)

Copies files for containerized deployment:

- ✅ Works in all Docker environments
- ✅ Portable and isolated
- ✅ Production-ready
- ❌ Requires reinstall after changes

```bash
dify-install install -m docker
```

## What Gets Installed

The installer creates the following in your Dify installation:

**Symlinks/Copies:**
1. `api/core/workflow/nodes/_custom` → Custom node backend code
2. `web/app/components/workflow/nodes/_custom` → Custom node frontend code
3. `api/core/dify_custom_nodes` → Python SDK
4. `web/dify_custom_nodes_sdk` → TypeScript SDK

**Patches:**
1. Frontend auto-loader for custom panels

## Development

### Build

```bash
npm run build
```

### Run Locally

```bash
npm run dev -- install
```

### Test

```bash
# Install in dev mode
npm run dev -- install -t ../../../dify -m dev -v

# Check info
npm run dev -- info -t ../../../dify

# Uninstall
npm run dev -- uninstall -t ../../../dify -v
```

## Architecture

```
installer/cli/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── installer.ts      # Core installation logic
│   ├── types.ts          # Type definitions
│   └── utils.ts          # Utility functions
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

The installer provides detailed error messages:

```bash
✗ Installation failed

Failed to create symlink: api/core/workflow/nodes/_custom

Errors:
  • Source does not exist: /path/to/nodes
  • Target already exists and is not a symlink
```

Common issues:

1. **"Not a valid Dify installation"**
   - Ensure you're pointing to the correct Dify directory
   - Check that `api/`, `web/`, and `docker/` directories exist

2. **"Target exists and is not a symlink"**
   - Remove the existing directory first
   - Or use `--force` to overwrite

3. **"Failed to apply patch"**
   - Patch might already be applied
   - Check if the target file has been modified
   - Use `--skip-patches` to skip patching

## Uninstalling

To remove dify-patcher:

```bash
dify-install uninstall -t /path/to/dify
```

**Note:** Patches are not automatically reverted. To revert manually:

```bash
cd /path/to/dify
git apply --reverse patches/001-custom-panel-loader.patch
```

## License

MIT
