# Dify Custom Nodes Patcher

> **Zero-Fork Plugin Architecture for Dify**

A complete solution for developing and deploying custom workflow nodes for Dify **without forking the core repository**.

## 🌟 Features

- **🔌 Zero Fork** - Never fork Dify again. Apply minimal patches and mount custom nodes externally
- **📦 Modular** - Each custom node is a self-contained package with backend + frontend
- **🔄 Update-Friendly** - When Dify updates, just re-apply patches (only 5 files!)
- **🎨 Clean SDK** - Simple, typed APIs for Python and TypeScript
- **🚀 Hot Reload** - Development mode with instant changes
- **📚 Auto-Discovery** - Custom nodes and panels automatically discovered at runtime
- **🎛️ Custom Panels** - Build rich UI panels with 30+ components
- **🐳 Docker Ready** - Full Docker Compose integration

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Installation](#installation)
- [Creating Custom Nodes](#creating-custom-nodes)
- [Custom Panels](#custom-panels)
- [Examples](#examples)
- [SDK Reference](#sdk-reference)
- [Updating Dify](#updating-dify)
- [Contributing](#contributing)

## 🚀 Quick Start

### 1. Clone this repository

```bash
# Clone alongside your Dify installation
cd /path/to/your/projects
git clone https://github.com/mineclover/dify-patcher.git
```

### 2. Install to Dify

```bash
cd dify-patcher

# For Docker deployment
./installer/install.sh --target ../dify --mode docker

# For local development
./installer/install.sh --target ../dify --mode dev
```

### 3. Enable custom nodes

```bash
# For Docker
echo "CUSTOM_NODES_ENABLED=true" >> ../dify/docker/.env
cd ../dify/docker && docker-compose up -d

# For local development
echo "CUSTOM_NODES_ENABLED=true" >> ../dify/.env
echo "NEXT_PUBLIC_CUSTOM_NODES_ENABLED=true" >> ../dify/web/.env.local
```

### 4. Create your first custom node

```bash
cd dify-patcher
./scripts/create-node.sh my-awesome-node
```

That's it! Your custom node is now available in Dify's workflow editor.

## 🏗️ Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                  Dify Core (Unchanged)                      │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │  5 Files Patched (Minimal Injection Points)       │     │
│  │  - api/core/workflow/nodes/node_mapping.py        │     │
│  │  - web/app/components/workflow/nodes/components.ts│     │
│  │  - (3 more...)                                     │     │
│  └───────────────────────────────────────────────────┘     │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────┐     │
│  │      Dynamic Loader (Auto-Discovery)              │     │
│  └───────────────────────────────────────────────────┘     │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────────────┐
        │   External Volume Mount (Read-Only)          │
        │                                               │
        │   dify-patcher/nodes/                        │
        │   ├── weather-api/                           │
        │   │   ├── manifest.json                      │
        │   │   ├── backend/node.py                    │
        │   │   └── frontend/                          │
        │   ├── database-query/                        │
        │   └── custom-api/                            │
        └───────────────────────────────────────────────┘
```

### Key Principles

1. **Minimal Patches** - Only 5 files in Dify core are modified
2. **External Mount** - All custom nodes live in this repository
3. **Auto-Discovery** - Nodes are discovered by scanning manifest.json files
4. **Type Safety** - Full TypeScript and Python type hints
5. **Clean Separation** - Backend and frontend code clearly separated

## 📦 Installation

### Prerequisites

- **Dify** installed locally or via Docker
- **Python 3.10+** with `pip` or `uv`
- **Node.js 18+** with `pnpm` or `npm`
- **Git**

### Docker Mode (Production)

```bash
# 1. Install patcher
./installer/install.sh --target /path/to/dify --mode docker

# 2. This creates docker-compose.override.yml with volume mounts
# 3. Start Dify
cd /path/to/dify/docker
docker-compose up -d

# 4. Check logs for loaded custom nodes
docker-compose logs -f api | grep "custom node"
```

### Development Mode (Local)

```bash
# 1. Install patcher with symlinks
./installer/install.sh --target /path/to/dify --mode dev

# 2. Start Dify backend
cd /path/to/dify
uv run --project api python -m flask run

# 3. Start Dify frontend (in another terminal)
cd /path/to/dify/web
pnpm dev

# 4. Changes to custom nodes are immediately reflected
```

## 🎨 Creating Custom Nodes

### Using the Generator

```bash
./scripts/create-node.sh my-custom-node
```

This creates a complete node template with:

- `manifest.json` - Node metadata
- `backend/node.py` - Python implementation
- `frontend/node.tsx` - Canvas UI component
- `frontend/panel.tsx` - Configuration panel
- `README.md` - Documentation

### Manual Creation

#### 1. Create Directory Structure

```
nodes/my-node/
├── manifest.json
├── backend/
│   ├── __init__.py
│   └── node.py
└── frontend/
    ├── index.ts
    ├── types.ts
    ├── node.tsx
    ├── panel.tsx
    ├── use-config.ts
    └── default.ts
```

#### 2. Define Manifest

```json
{
  "node_type": "my-node",
  "version": "1",
  "name": "My Custom Node",
  "description": "Does something awesome",
  "author": "Your Name",
  "icon": "🚀",
  "category": "custom"
}
```

#### 3. Implement Backend (Python)

```python
from dify_custom_nodes import BaseCustomNode, register_node, NodeRunResult
from dify_custom_nodes.types import VarType, WorkflowNodeExecutionStatus

@register_node('my-node', version='1')
class MyNode(BaseCustomNode):
    @classmethod
    def get_schema(cls):
        return {
            "type": "object",
            "properties": {
                "input_text": {"type": "string", "title": "Input"}
            },
            "required": ["input_text"]
        }

    @classmethod
    def get_output_vars(cls, payload=None):
        return [
            {"variable": "output", "type": VarType.STRING, "description": "Result"}
        ]

    def _run(self) -> NodeRunResult:
        text = self.get_input('input_text')
        return {
            'status': WorkflowNodeExecutionStatus.SUCCEEDED,
            'outputs': {'output': f"Processed: {text}"}
        }
```

#### 4. Implement Frontend (TypeScript/React)

```tsx
// frontend/node.tsx
export const MyNode: FC<NodeProps<MyNodeData>> = ({ data }) => (
  <div>{data.input_text}</div>
)

// frontend/panel.tsx
export const MyPanel: FC<NodePanelProps<MyNodeData>> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <Field title="Input">
      <Input value={inputs.input_text} onChange={handleFieldChange('input_text')} />
    </Field>
  )
}
```

## 🎛️ Custom Panels

Build rich configuration UIs for your custom nodes with **automatic panel discovery** and 30+ UI components.

### Automatic Panel Loading

Panels are automatically discovered and registered - no manual imports needed!

```typescript
// frontend/index.ts - Auto-discovered by dify-patcher
export { MyNode as NodeComponent } from './node'
export { MyPanel as PanelComponent } from './panel'  // ← Auto-registered
export const nodeType = manifest.node_type
```

### Available UI Components

**Basic Inputs:**
- `Input` - Single-line text
- `Textarea` - Multi-line text
- `Select` - Dropdown selection
- `Switch` - Boolean toggle
- `InputNumberWithSlider` - Number with slider

**Variable Components:**
- `VarReferencePicker` - Select workflow variables
- `InputSupportSelectVar` - Text with `{{#variable#}}` insertion
- `VarList` - Multiple variable management

**Advanced:**
- `CodeEditor` - Monaco editor with syntax highlighting
- `Collapse` - Collapsible sections
- `Field` - Layout wrapper with label/tooltip

### Example Panel

```typescript
import { useConfig } from './use-config'
import { useAvailableVarList } from '@/app/components/workflow/nodes/_base/hooks/use-available-var-list'
import Field from '@/app/components/workflow/nodes/_base/components/field'
import Input from '@/app/components/workflow/nodes/_base/components/input'
import { VarReferencePicker } from '@/app/components/workflow/nodes/_base/components/variable'

export const MyPanel: FC<NodePanelProps> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)
  const { availableVars } = useAvailableVarList(id)

  return (
    <div className="space-y-4">
      <Field title="Name" required tooltip="Enter a name">
        <Input
          value={inputs.name}
          onChange={handleFieldChange('name')}
        />
      </Field>

      <Field title="Input Variable">
        <VarReferencePicker
          nodeId={id}
          availableVars={availableVars}
          value={inputs.variable}
          onChange={handleFieldChange('variable')}
        />
      </Field>
    </div>
  )
}
```

### Panel Documentation

- **[Panel Components Reference](./conventions/panel-components.md)** (22KB) - Complete API reference for all 30+ components
- **[Custom Panel Guide](./conventions/custom-panel-guide.md)** (24KB) - Step-by-step tutorials and patterns
- **[Panel Extension Guide](./PANEL_EXTENSION.md)** - How auto-discovery works
- **[Advanced Panel Example](./nodes/advanced-panel-example/)** - Live reference implementation

### Panel Features

✅ **Auto-Discovery** - Panels automatically registered from `_custom` directory
✅ **Hot Reload** - Instant updates in dev mode
✅ **Type Safe** - Full TypeScript support
✅ **Variable System** - Integrate with workflow variables
✅ **30+ Components** - Rich UI component library
✅ **Validation** - Built-in validation patterns
✅ **i18n Ready** - Internationalization support

## 📚 Examples

### Included Examples

- **weather-api** - Production-ready API integration
  - External API calls with error handling
  - Multiple output types
  - Complete panel UI

- **advanced-panel-example** - Panel UI reference
  - Demonstrates all 30+ UI components
  - Variable selection and insertion
  - Conditional rendering and validation
  - Dynamic lists and collapsible sections
  - Complete documentation

More examples coming soon:
- Database query node
- Custom API integration
- Data transformation node

### Community Examples

Have a cool custom node? Submit a PR to add it to the examples!

## 📖 SDK Reference

### Python SDK

```python
from dify_custom_nodes import BaseCustomNode, register_node, NodeRunResult

@register_node('node-type', version='1')
class MyNode(BaseCustomNode):
    @classmethod
    def get_schema(cls) -> dict:
        """Return JSON Schema for configuration UI"""

    @classmethod
    def get_output_vars(cls, payload=None) -> list:
        """Define output variables"""

    def _run(self) -> NodeRunResult:
        """Execute node logic"""
```

**Utility methods:**
- `self.get_input(key, default)` - Get configuration value
- `self.get_variable(selector)` - Get workflow variable
- `self.validate_inputs(inputs)` - Custom validation (optional)

See [SDK Documentation](./sdk/python/README.md) for full API reference.

### TypeScript SDK

```typescript
import { createNodeComponent, createPanelComponent, useConfig } from '@dify/custom-nodes-sdk'

const MyNode = createNodeComponent<MyNodeData>((props) => {
  const { data } = props
  return <div>{data.myField}</div>
})

const MyPanel = createPanelComponent<MyNodeData>((props) => {
  const { id, data } = props
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <Field title="My Field">
      <Input value={inputs.myField} onChange={handleFieldChange('myField')} />
    </Field>
  )
})
```

See [SDK Documentation](./sdk/typescript/README.md) for full API reference.

## 🔄 Updating Dify

When Dify releases an update:

```bash
# 1. Update Dify
cd /path/to/dify
git pull upstream main

# 2. Check if patches still apply
cd /path/to/dify-patcher
./installer/patcher.py --target /path/to/dify --patches installer/patches --dry-run

# 3. Re-apply patches if needed
./installer/install.sh --target /path/to/dify --mode docker

# 4. Restart Dify
cd /path/to/dify/docker
docker-compose restart
```

**Only 5 files need to be checked!** If Dify changed those files, we'll update the patches.

## 🛠️ Development Workflow

```bash
# 1. Create new node
./scripts/create-node.sh my-node

# 2. Edit implementation
# - nodes/my-node/backend/node.py
# - nodes/my-node/frontend/panel.tsx

# 3. Install in dev mode (if not already)
./installer/install.sh --target ../dify --mode dev

# 4. Test in Dify
# Changes are immediately reflected (symlinks)

# 5. Commit your node
git add nodes/my-node
git commit -m "Add my-node custom node"
```

## 📁 Project Structure

```
dify-patcher/
├── installer/              # Installation scripts
│   ├── install.sh         # Main installer
│   ├── patcher.py         # Patch applier
│   ├── mount.py           # Volume/symlink manager
│   └── patches/           # Patch files for Dify
│
├── sdk/                   # Development SDKs
│   ├── python/            # Python SDK
│   └── typescript/        # TypeScript SDK
│
├── nodes/                 # Custom nodes
│   ├── weather-api/       # Example node
│   └── [your-nodes]/
│
├── scripts/               # Utility scripts
│   ├── create-node.sh     # Node generator
│   └── dev.sh             # Dev environment setup
│
└── README.md              # This file
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork this repository
2. Create a feature branch
3. Add your custom node in `nodes/`
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/mineclover/dify-patcher/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mineclover/dify-patcher/discussions)

## 🙏 Acknowledgments

- [Dify](https://github.com/langgenius/dify) - The amazing LLM application platform
- All contributors to this project

---

**Made with ❤️ for the Dify community**
