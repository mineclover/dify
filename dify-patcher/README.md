# Dify Custom Nodes Patcher

> **Zero-Fork Plugin Architecture for Dify**

A complete solution for developing and deploying custom workflow nodes for Dify **without forking the core repository**.

## 🌟 Features

- **🔌 Zero Fork** - Never fork Dify again. Apply minimal patches and mount custom nodes externally
- **📦 Modular** - Each custom node is a self-contained package with backend + frontend
- **🔄 Update-Friendly** - When Dify updates, just re-apply patches (only 5 files!)
- **🎨 Clean SDK** - Simple, typed APIs for Python and TypeScript
- **🔷 Type Safety** - Import Dify types directly via path mapping for full type compatibility
- **🚀 Hot Reload** - Development mode with instant changes
- **📚 Auto-Discovery** - Custom nodes and panels automatically discovered at runtime
- **🎛️ Custom Panels** - Build rich UI panels with 30+ components
- **💾 State Management** - StateManager SDK for persistent conversation variables
- **⚡ Interactive Installer** - Cross-platform CLI with guided setup
- **🐳 Docker Ready** - Full Docker Compose integration

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Installation](#installation)
- [Creating Custom Nodes](#creating-custom-nodes)
- [Type System Integration](#-type-system-integration)
- [Custom Panels](#custom-panels)
- [Examples](#examples)
- [State Management](#-state-management)
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

**Option A: Interactive Installer (Recommended)**

```bash
cd dify-patcher/installer/cli
npm install
npm run dev -- install
```

The interactive installer will guide you through:
- Selecting Dify installation path
- Choosing installation mode (dev/docker)
- Configuration options

**Option B: Command Line**

```bash
cd dify-patcher/installer/cli
npm install
npm run build

# Development mode (with hot reload)
npm start -- install --target ../../dify --mode dev

# Docker mode (for containers)
npm start -- install --target ../../dify --mode docker
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
- **Node.js 16+** with `npm` (for installer)
- **Git**

### Interactive Installer (Recommended)

The easiest way to install:

```bash
cd dify-patcher/installer/cli
npm install
npm run dev -- install
```

Features:
- ✅ **Guided setup** with prompts and validation
- ✅ **Cross-platform** (Windows, macOS, Linux)
- ✅ **Progress indicators** and colored output
- ✅ **Error handling** with helpful messages
- ✅ **Uninstall support** for clean removal

See [Installer CLI Documentation](./installer/cli/README.md) for advanced usage.

### Docker Mode (Production)

```bash
# 1. Install patcher
cd dify-patcher/installer/cli
npm install
npm start -- install --target ../../dify --mode docker

# 2. Add to environment variables
echo "CUSTOM_NODES_ENABLED=true" >> ../../dify/docker/.env

# 3. Start Dify
cd ../../dify/docker
docker-compose up -d

# 4. Check logs for loaded custom nodes
docker-compose logs -f api | grep "custom node"
```

### Development Mode (Local)

```bash
# 1. Install patcher with symlinks (for hot reload)
cd dify-patcher/installer/cli
npm install
npm start -- install --target ../../dify --mode dev

# 2. Add to environment variables
echo "CUSTOM_NODES_ENABLED=true" >> ../../dify/.env
echo "NEXT_PUBLIC_CUSTOM_NODES_ENABLED=true" >> ../../dify/web/.env.local

# 3. Start Dify backend
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

## 🔷 Type System Integration

dify-patcher integrates directly with Dify's type system to provide **full type safety** and **zero type duplication**. All custom nodes can import Dify's core types via path mapping.

### Overview

When developing custom nodes, you can choose between two approaches:

1. **Recommended: Import Dify Types** - Full compatibility with Dify's workflow system
2. **Compatibility: Use SDK Types** - Simplified types for standalone development

### Importing Dify Types

The recommended approach is to import types directly from Dify:

```typescript
// frontend/types.ts
import type { CommonNodeType } from '@dify/types'

export interface MyNodeData extends CommonNodeType<{
  // Your custom fields
  myField: string
  myOptionalField?: number
}> {
  type: 'my-node'  // Must match manifest.json node_type
}
```

**Benefits:**
- ✅ Full type safety with all Dify fields
- ✅ Automatic updates when Dify types change
- ✅ Access to Dify's panel utilities and APIs
- ✅ IntelliSense for all workflow properties

### Using Panel Props

Import `NodePanelProps` for full access to Dify's panel APIs:

```typescript
// frontend/panel.tsx
import type { NodePanelProps } from '@dify/types'
import type { MyNodeData } from './types'

export const MyPanel: FC<NodePanelProps<MyNodeData>> = ({
  id,
  data,
  panelProps  // Dify's panel utilities
}) => {
  // Access to panel APIs
  const inputVars = panelProps.getInputVars(['field1', 'field2'])
  const varInputs = panelProps.toVarInputs(variables)

  return <div>...</div>
}
```

### Using Node Props

Import `NodeProps` for canvas components:

```typescript
// frontend/node.tsx
import type { NodeProps } from '@dify/types'
import type { MyNodeData } from './types'

export const MyNode: FC<NodeProps<MyNodeData>> = ({ id, data }) => {
  return (
    <div>
      <div>{data.myField}</div>
      {/* Access all Dify runtime state */}
      {data._runningStatus === 'running' && <Spinner />}
    </div>
  )
}
```

### Available Type Imports

#### From `@dify/types` (Core Workflow Types)

```typescript
import type {
  // Node types
  CommonNodeType,      // Main node data type
  Node,                // ReactFlow node wrapper
  NodeProps,           // Canvas component props
  NodePanelProps,      // Panel component props

  // Edge types
  CommonEdgeType,
  Edge,

  // Enums
  BlockEnum,           // All node type identifiers
  ErrorHandleMode,

  // Utility types
  ValueSelector,       // [nodeId, key path]
  Variable,
  Branch,
} from '@dify/types'
```

#### From `@dify/types/workflow` (Runtime Types)

```typescript
import type {
  PanelProps,         // Panel utilities and APIs
  NodeTracing,        // Execution tracing
  FileResponse,       // File handling
} from '@dify/types/workflow'
```

### TypeScript Configuration

dify-patcher is configured to work both as:
1. **Current structure**: `/dify/` and `/dify-patcher/` side-by-side
2. **Submodule structure**: `/project/dify/` and `/project/dify-patcher/`

The path mapping automatically resolves to the correct location:

```json
// tsconfig.json (already configured)
{
  "paths": {
    "@dify/types": [
      "../web/app/components/workflow/types",      // Current
      "../dify/web/app/components/workflow/types"  // Submodule
    ]
  }
}
```

### Complete Example

Here's a complete custom node using Dify types:

```typescript
// frontend/types.ts
import type { CommonNodeType } from '@dify/types'

export interface WeatherNodeData extends CommonNodeType<{
  api_key: string
  city: string
  units?: 'metric' | 'imperial'
}> {
  type: 'weather-api'
}

// frontend/panel.tsx
import type { FC } from 'react'
import type { NodePanelProps } from '@dify/types'
import type { WeatherNodeData } from './types'
import { useConfig } from './use-config'

export const WeatherPanel: FC<NodePanelProps<WeatherNodeData>> = ({
  id,
  data,
  panelProps
}) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="space-y-4">
      <Field title="API Key" required>
        <Input
          type="password"
          value={inputs.api_key || ''}
          onChange={handleFieldChange('api_key')}
        />
      </Field>

      <Field title="City" required>
        <Input
          value={inputs.city || ''}
          onChange={handleFieldChange('city')}
        />
      </Field>

      <Field title="Units">
        <Select
          value={inputs.units || 'metric'}
          onChange={handleFieldChange('units')}
          options={[
            { label: 'Metric (°C)', value: 'metric' },
            { label: 'Imperial (°F)', value: 'imperial' }
          ]}
        />
      </Field>
    </div>
  )
}

// frontend/node.tsx
import type { FC } from 'react'
import type { NodeProps } from '@dify/types'
import type { WeatherNodeData } from './types'

export const WeatherNode: FC<NodeProps<WeatherNodeData>> = ({ data }) => {
  return (
    <div className="px-3 py-1">
      <div className="text-xs font-medium">
        🌤️ {data.city}
      </div>
      <div className="text-xs text-gray-500">
        {data.units === 'imperial' ? '°F' : '°C'}
      </div>
    </div>
  )
}
```

### Migration from SDK Types

If you have existing nodes using SDK types, migration is straightforward:

**Before:**
```typescript
import type { CustomNodeData, NodePanelProps } from '../../../sdk/typescript/src/types'

export interface MyNodeData extends CustomNodeData {
  type: 'my-node'
  myField: string
}
```

**After:**
```typescript
import type { CommonNodeType, NodePanelProps } from '@dify/types'

export interface MyNodeData extends CommonNodeType<{
  myField: string
}> {
  type: 'my-node'
}
```

### Best Practices

1. **Always extend `CommonNodeType<T>`** for full Dify compatibility
2. **Specify node type explicitly** to match `manifest.json`
3. **Use Dify's `NodePanelProps`** to access panel utilities
4. **Import from `@dify/types`** rather than local definitions
5. **Keep custom fields in the generic parameter** `CommonNodeType<{...}>`

### Advanced Topics

For detailed information about:
- Type system architecture
- Path mapping configuration
- Troubleshooting type errors
- Submodule setup

See the comprehensive [Type System Documentation](./TYPE_SYSTEM.md).

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

- **stateful-chat-example** - State management patterns
  - Conversation history tracking
  - Turn counters and accumulators
  - Feature flags and session context
  - StateManager SDK usage
  - Complete workflow example

More examples coming soon:
- Database query node
- Custom API integration
- Data transformation node

### Community Examples

Have a cool custom node? Submit a PR to add it to the examples!

## 🔄 State Management

Build stateful workflows with **persistent conversation variables** and the **StateManager SDK**.

### Overview

Dify provides a comprehensive state management system that allows custom nodes to maintain state across conversation turns, track history, and build complex stateful logic.

**Key Capabilities:**

- ✅ **Conversation Variables** - Persistent state across sessions (stored in DB)
- ✅ **Environment Variables** - App-level global configuration
- ✅ **System Variables** - Runtime information (conversation_id, user_id, etc.)
- ✅ **Variable Assigner** - Built-in node for state updates
- ✅ **StateManager SDK** - Helper utilities for custom nodes

### Quick Example

```python
from dify_custom_nodes import StateManager, StatePattern

def _run(self) -> NodeRunResult:
    # Create state manager
    state = StateManager(self.graph_runtime_state.variable_pool)

    # Read persistent conversation variables
    user_count = state.get_conversation_var('user_count') or 0
    chat_history = state.get_conversation_var('chat_history') or []

    # Read environment variables
    api_url = state.get_env_var('api_base_url')

    # Process with state
    result = self.process(user_count, chat_history)

    # Prepare outputs for Variable Assigner to persist state
    return {
        'status': WorkflowNodeExecutionStatus.SUCCEEDED,
        'outputs': {
            'result': result,
            **state.output_for_conv_var('user_count', user_count + 1),
            **state.output_for_conv_var('chat_history', chat_history + [new_item])
        }
    }
```

### StateManager SDK

**Available in Python SDK** (`dify_custom_nodes.StateManager`):

```python
# Read state
state.get_conversation_var('name')    # Persistent across sessions
state.get_env_var('name')             # App-level configuration
state.get_system_var('name')          # Runtime information
state.get_node_var('node_id', 'var')  # Other node outputs

# Prepare outputs for Variable Assigner
state.output_for_conv_var('name', value)
state.create_accumulator_output('list_name', new_item)
```

**StatePattern Helpers**:

```python
# Counter increment
StatePattern.counter_increment(state, 'turn_count')

# Feature flags
if StatePattern.feature_flag_check(state, 'advanced_mode'):
    result = advanced_processing()

# Session context
context = StatePattern.session_context_init()
```

### Workflow Pattern

To persist state, connect custom node outputs to Variable Assigner nodes:

```
[Your Custom Node]
    ↓ outputs: conv_var_user_count, conv_var_history
    ↓
[Variable Assigner #1]
    operation: SET
    variable: conversation.user_count
    value: [your-node.conv_var_user_count]
    ↓
[Variable Assigner #2]
    operation: SET
    variable: conversation.history
    value: [your-node.conv_var_history]
```

### Documentation

- **[State Management Analysis](./STATE_MANAGEMENT_ANALYSIS.md)** - Complete architecture overview
- **[Stateful Chat Example](./nodes/stateful-chat-example/)** - Working implementation
- **[StateManager API](./sdk/python/dify_custom_nodes/state_helpers.py)** - SDK source code

### Common Patterns

**Turn Counter:**
```python
turn_count_output = StatePattern.counter_increment(state, 'turn_count')
```

**Conversation History (Accumulator):**
```python
history = state.get_conversation_var('chat_history') or []
updated_history = (history + [new_message])[-max_items:]  # Keep last N
output = state.output_for_conv_var('chat_history', updated_history)
```

**Feature Flags:**
```python
flags = state.get_conversation_var('feature_flags') or {}
flags['detailed_mode'] = user_preference
output = state.output_for_conv_var('feature_flags', flags)
```

**Session Context:**
```python
context = state.get_conversation_var('session_context') or StatePattern.session_context_init()
context['intent'] = detected_intent
context['topic_history'].append(current_topic)
output = state.output_for_conv_var('session_context', context)
```

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

# 2. Re-install dify-patcher (re-applies patches)
cd /path/to/dify-patcher/installer/cli
npm start -- install --target ../../dify --mode docker

# 3. Restart Dify
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
cd installer/cli
npm start -- install --target ../../dify --mode dev

# 4. Test in Dify
# Changes are immediately reflected (symlinks)

# 5. Commit your node
git add nodes/my-node
git commit -m "Add my-node custom node"
```

## 📁 Project Structure

```
dify-patcher/
├── installer/              # Installation tools
│   ├── cli/               # TypeScript CLI installer (recommended)
│   │   ├── src/           # TypeScript source
│   │   ├── package.json   # NPM package
│   │   └── README.md      # CLI documentation
│   └── patches/           # Patch files for Dify
│
├── sdk/                   # Development SDKs
│   ├── python/            # Python SDK for backend nodes
│   └── typescript/        # TypeScript SDK for frontend
│       ├── src/types.ts   # Type definitions
│       └── tsconfig.json  # TypeScript configuration
│
├── nodes/                 # Custom nodes
│   ├── agno-agent/        # Agno AgentOS integration
│   └── [your-nodes]/      # Your custom nodes
│
├── scripts/               # Utility scripts
│   └── create-node.sh     # Node generator
│
├── tsconfig.json          # Root TypeScript config (type imports)
├── TYPE_SYSTEM.md         # Type system integration guide
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
