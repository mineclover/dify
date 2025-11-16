# dify-patcher Architecture

Complete overview of the dify-patcher repository structure and design.

## 🎯 Mission

Enable custom workflow node development for Dify **without forking the core repository**.

## 📐 Design Principles

1. **Zero Fork** - Dify core remains unchanged (except 5 minimal patches)
2. **External Mount** - All custom code lives outside Dify
3. **Auto-Discovery** - Nodes automatically registered at runtime
4. **Horizontal Scaling** - Easy to add new nodes, conventions, examples
5. **Self-Documenting** - Comprehensive docs for every pattern

---

## 🗂️ Directory Structure

```
dify-patcher/
├── conventions/          # 📚 Codebase patterns & best practices
│   ├── README.md         #    Quick reference index
│   ├── backend-*         #    Python/Pydantic patterns
│   ├── frontend-*        #    React/TypeScript patterns
│   ├── input-types.md    #    All input type reference
│   ├── edge-patterns.md  #    Handle/connection patterns
│   ├── variable-system.md#    Variable pool deep dive
│   └── common-mistakes.md#    Pitfalls & solutions
│
├── docs/                 # 📖 User-facing documentation
│   ├── guides/           #    Step-by-step tutorials
│   └── api-reference/    #    API documentation
│
├── examples/             # 💡 Example implementations
│   └── (future)          #    More complex examples
│
├── installer/            # 🔧 Installation tools
│   ├── install.sh        #    Main installer
│   ├── patcher.py        #    Git patch applier
│   ├── mount.py          #    Volume/symlink manager
│   └── patches/          #    Patch files for Dify
│
├── nodes/                # 🎨 Custom node implementations
│   ├── weather-api/      #    Example: OpenWeatherMap
│   └── [your-nodes]/     #    Add more nodes here
│
├── scripts/              # 🛠️ Development utilities
│   ├── create-node.sh    #    Generate new node template
│   └── dev.sh            #    Dev environment setup
│
├── sdk/                  # 📦 Development SDKs
│   ├── python/           #    Python SDK for backends
│   │   ├── pyproject.toml
│   │   └── dify_custom_nodes/
│   │       ├── base_node.py
│   │       ├── decorators.py
│   │       └── types.py
│   │
│   └── typescript/       #    TypeScript SDK for frontends
│       ├── package.json
│       └── src/
│           ├── base-node.tsx
│           ├── base-panel.tsx
│           ├── use-config.ts
│           └── types.ts
│
├── templates/            # 📋 Reusable templates
│   └── (future)          #    Node templates
│
├── README.md             # 🏠 Main documentation
├── ARCHITECTURE.md       # 📐 This file
└── LICENSE               # ⚖️ MIT License
```

---

## 🔄 How It Works

### Installation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User runs: ./installer/install.sh --target ../dify      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. patcher.py applies 5 minimal patches to Dify core       │
│    - api/core/workflow/nodes/node_mapping.py               │
│    - web/app/components/workflow/nodes/components.ts       │
│    - (3 more small patches)                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. mount.py sets up volume mounts or symlinks              │
│    Docker:  Creates docker-compose.override.yml            │
│    Dev:     Creates symlinks to dify-patcher/nodes/        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SDKs installed                                           │
│    pip install -e dify-patcher/sdk/python                   │
│    pnpm install dify-patcher/sdk/typescript                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Dify starts with custom nodes enabled                   │
│    CUSTOM_NODES_ENABLED=true                                │
└─────────────────────────────────────────────────────────────┘
```

### Runtime Flow

```
Dify Startup
     │
     ▼
┌──────────────────────────────────────┐
│ Load NODE_TYPE_CLASSES_MAPPING      │ (patched file)
└──────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Scan /extensions/custom_nodes/      │ (mounted volume)
└──────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ For each node directory:             │
│   1. Read manifest.json              │
│   2. Import backend/node.py          │
│   3. Register in mapping             │
└──────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Frontend loads components.ts         │ (patched file)
└──────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Scan /_custom/ directory             │ (mounted volume)
└──────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ For each node:                       │
│   1. Import frontend/index.ts        │
│   2. Register NodeComponent          │
│   3. Register PanelComponent         │
└──────────────────────────────────────┘
     │
     ▼
Custom nodes available in UI!
```

---

## 🏗️ Horizontal Scalability Design

### Adding New Nodes

```bash
# 1. Generate template
./scripts/create-node.sh my-new-node

# 2. Implement
vim nodes/my-new-node/backend/node.py
vim nodes/my-new-node/frontend/panel.tsx

# 3. Done! No registration needed - auto-discovered
```

### Adding New Conventions

```bash
# 1. Create documentation
vim conventions/my-pattern.md

# 2. Update index
vim conventions/README.md

# 3. Commit
git add conventions/
git commit -m "Add my-pattern convention"
```

### Adding New Examples

```bash
# 1. Create example directory
mkdir examples/advanced-llm-node

# 2. Copy full implementation
cp -r nodes/weather-api examples/advanced-llm-node

# 3. Add README explaining the pattern
vim examples/advanced-llm-node/README.md
```

### Adding New Templates

```bash
# 1. Create template
mkdir templates/database-node-template

# 2. Add files with placeholders
vim templates/database-node-template/backend/node.py
# Use {{NODE_NAME}}, {{CLASS_NAME}} placeholders

# 3. Update create-node.sh to offer template options
```

---

## 🔌 Plugin Architecture

### Backend: Dynamic Node Loading

```python
# In patched node_mapping.py
def _load_custom_nodes() -> Mapping[NodeType, Mapping[str, type[Node]]]:
    """Load custom nodes from extensions directory"""
    custom_mapping = {}

    # Scan custom nodes directory
    for node_dir in custom_nodes_path.iterdir():
        # Read manifest
        manifest = json.loads((node_dir / 'manifest.json').read_text())

        # Dynamic import
        module = importlib.import_module('node')
        node_class = find_node_class(module)

        # Register
        custom_mapping[NodeType(manifest['node_type'])] = {
            LATEST_VERSION: node_class
        }

    return custom_mapping

# Merge with core nodes
NODE_TYPE_CLASSES_MAPPING = {
    **CORE_NODES,
    **_load_custom_nodes()  # Auto-discovered
}
```

### Frontend: Dynamic Component Loading

```typescript
// In patched components.ts
let customNodeComponents = {}
let customPanelComponents = {}

if (process.env.NEXT_PUBLIC_CUSTOM_NODES_ENABLED === 'true') {
  // Auto-load from _custom directory
  const modules = import.meta.glob('./_custom/*/frontend/index.ts', { eager: true })

  Object.entries(modules).forEach(([path, module]) => {
    const { nodeType, NodeComponent, PanelComponent } = module
    customNodeComponents[nodeType] = NodeComponent
    customPanelComponents[nodeType] = PanelComponent
  })
}

// Merge with core components
export const NodeComponentMap = {
  ...CORE_COMPONENTS,
  ...customNodeComponents  // Auto-discovered
}
```

---

## 📊 Information Architecture

### Conventions Layer

**Purpose**: Document Dify's existing patterns

**Content**:
- Extracted from codebase analysis
- Shows how Dify core does things
- Reference for custom node developers

**Files**:
- `backend-patterns.md` - Complete backend analysis
- `frontend-patterns.md` - Complete frontend analysis
- `panel-components.md` - **NEW** Panel UI components reference
- `custom-panel-guide.md` - **NEW** Panel development guide
- `input-types.md` - All input type reference
- `edge-patterns.md` - Handle/connection deep dive
- `variable-system.md` - Variable pool architecture
- `common-mistakes.md` - Known pitfalls

### SDK Layer

**Purpose**: Simplify custom node development

**Content**:
- Wrapper classes around Dify core
- Type-safe interfaces
- Helper functions

**Components**:
- `BaseCustomNode` - Simplified node base class
- `@register_node` - Automatic registration
- `useConfig` - State management hook
- Type definitions for all data structures

### Examples Layer

**Purpose**: Show complete implementations

**Content**:
- Real, working custom nodes
- Demonstrates patterns from conventions
- Copy-paste starting points

**Current**:
- `weather-api` - External API integration (production-ready example)
- `advanced-panel-example` - Panel UI patterns showcase (educational reference)

**Future**:
- Database query node
- File processing node
- Multi-step agent node
- Custom LLM integration

### Templates Layer (Future)

**Purpose**: Accelerate development

**Content**:
- Pre-built node structures
- Parameterized templates
- Common pattern implementations

---

## 🔐 Security Considerations

### Read-Only Mounts

Custom nodes are mounted read-only in production:

```yaml
volumes:
  - ./dify-patcher/nodes:/app/api/extensions/custom_nodes:ro  # :ro = read-only
```

### No Core Modifications

Custom nodes cannot modify Dify core:
- Separate process space
- Limited API surface
- Sandboxed execution

### Secret Handling

SDK provides safe secret handling:
```python
# Automatic masking in logs
logger.info(f"Using API key: {self.mask_secret(api_key)}")
```

---

## 🚀 Future Enhancements

### Phase 2: Plugin Marketplace

```
marketplace/
├── index.json            # Registry of available plugins
├── node-packages/        # Published node packages
└── verification/         # Security verification
```

### Phase 3: Visual Node Builder

```
builders/
├── visual-editor/        # Drag-drop node builder
└── code-generator/       # Generate boilerplate
```

### Phase 4: Testing Framework

```
testing/
├── node-tester/          # Test harness for custom nodes
├── fixtures/             # Test data
└── integration/          # Integration test suite
```

---

## 📈 Metrics

### Current State

- **Installation**: 3 commands
- **Core patches**: 5 files
- **Documentation**: 200KB+ (conventions + guides)
- **Example nodes**: 2 (weather-api, advanced-panel-example)
- **Patterns documented**: 40+ (backend, frontend, panel)
- **UI Components documented**: 30+ panel components
- **Guides**: 2 comprehensive panel development guides

### Goals

- **Installation**: 1 command (installer improvement)
- **Core patches**: 5 files (no increase)
- **Documentation**: 300KB+ (more examples and patterns)
- **Example nodes**: 10+ (community contributions)
- **Patterns documented**: 60+ (ongoing)
- **Panel templates**: 5+ reusable panel templates

---

## 🤝 Contributing

### Adding Conventions

1. Analyze Dify codebase
2. Extract pattern
3. Document with examples
4. Add to conventions/README.md index

### Adding Examples

1. Build working node
2. Test thoroughly
3. Add comprehensive README
4. Submit PR

### Improving SDK

1. Identify common boilerplate
2. Create helper abstraction
3. Update SDK
4. Update examples to use it

---

## 📚 See Also

- [Main README](./README.md) - Getting started
- [Conventions](./conventions/README.md) - Pattern documentation
- [SDK Python](./sdk/python/README.md) - Python API
- [SDK TypeScript](./sdk/typescript/README.md) - TypeScript API

---

**Last Updated**: 2024-11-14
**Version**: 1.0.0
