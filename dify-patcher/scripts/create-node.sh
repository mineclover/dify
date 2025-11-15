#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check arguments
if [ $# -eq 0 ]; then
  echo -e "${RED}Error: Node name is required${NC}"
  echo ""
  echo "Usage: $0 <node-name>"
  echo ""
  echo "Example:"
  echo "  $0 my-custom-node"
  echo ""
  exit 1
fi

NODE_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCHER_ROOT="$(dirname "$SCRIPT_DIR")"
NODE_DIR="$PATCHER_ROOT/nodes/$NODE_NAME"

# Validate node name
if [[ ! "$NODE_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo -e "${RED}Error: Invalid node name${NC}"
  echo "Node name must:"
  echo "  - Start with a lowercase letter"
  echo "  - Contain only lowercase letters, numbers, and hyphens"
  echo ""
  echo "Examples: my-node, weather-api, data-processor"
  exit 1
fi

# Check if node already exists
if [ -d "$NODE_DIR" ]; then
  echo -e "${RED}Error: Node '$NODE_NAME' already exists at:${NC}"
  echo "  $NODE_DIR"
  exit 1
fi

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           Create New Custom Node for Dify                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Creating node: ${YELLOW}$NODE_NAME${NC}"
echo -e "${BLUE}Location: ${YELLOW}$NODE_DIR${NC}"
echo ""

# Create directory structure
echo -e "${GREEN}📁 Creating directory structure...${NC}"
mkdir -p "$NODE_DIR/backend"
mkdir -p "$NODE_DIR/frontend"

# Convert node-name to NodeName for class names
NODE_CLASS_NAME=$(echo "$NODE_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')
NODE_DISPLAY_NAME=$(echo "$NODE_NAME" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')

# Create manifest.json
echo -e "${GREEN}📝 Creating manifest.json...${NC}"
cat > "$NODE_DIR/manifest.json" << EOF
{
  "node_type": "$NODE_NAME",
  "version": "1",
  "name": "$NODE_DISPLAY_NAME",
  "description": "Custom node: $NODE_DISPLAY_NAME",
  "author": "Your Name",
  "icon": "🔧",
  "category": "custom",
  "backend": {
    "entry": "node.py",
    "dependencies": []
  },
  "frontend": {
    "entry": "index.ts"
  },
  "inputs": {
    "input_text": {
      "type": "string",
      "title": "Input Text",
      "description": "Sample input field",
      "required": true
    }
  },
  "outputs": {
    "output_text": {
      "type": "string",
      "description": "Sample output field"
    }
  }
}
EOF

# Create backend __init__.py
echo -e "${GREEN}📝 Creating backend/__init__.py...${NC}"
cat > "$NODE_DIR/backend/__init__.py" << EOF
"""$NODE_DISPLAY_NAME Custom Node"""

from .node import ${NODE_CLASS_NAME}Node

__all__ = ['${NODE_CLASS_NAME}Node']
EOF

# Create backend node.py
echo -e "${GREEN}📝 Creating backend/node.py...${NC}"
cat > "$NODE_DIR/backend/node.py" << EOF
"""
$NODE_DISPLAY_NAME Node

TODO: Add description
"""

from typing import Any

from dify_custom_nodes import BaseCustomNode, register_node, NodeRunResult
from dify_custom_nodes.types import VarType, WorkflowNodeExecutionStatus


@register_node('$NODE_NAME', version='1', author='Your Name')
class ${NODE_CLASS_NAME}Node(BaseCustomNode):
    """
    $NODE_DISPLAY_NAME

    TODO: Add detailed description
    """

    @classmethod
    def get_schema(cls):
        """Define configuration schema"""
        return {
            "type": "object",
            "properties": {
                "input_text": {
                    "type": "string",
                    "title": "Input Text",
                    "description": "Sample input field",
                    "minLength": 1
                }
            },
            "required": ["input_text"]
        }

    @classmethod
    def get_output_vars(cls, payload=None):
        """Define output variables"""
        return [
            {
                "variable": "output_text",
                "type": VarType.STRING,
                "description": "Sample output field"
            }
        ]

    def _run(self) -> NodeRunResult:
        """Execute node logic"""
        # Get inputs
        input_text = self.get_input('input_text', '')

        # TODO: Implement your logic here
        output_text = f"Processed: {input_text}"

        return {
            'status': WorkflowNodeExecutionStatus.SUCCEEDED,
            'inputs': {'input_text': input_text},
            'outputs': {
                'output_text': output_text
            }
        }
EOF

# Create frontend index.ts
echo -e "${GREEN}📝 Creating frontend/index.ts...${NC}"
cat > "$NODE_DIR/frontend/index.ts" << EOF
/**
 * $NODE_DISPLAY_NAME Node - Frontend Components
 */

import manifest from '../manifest.json'

export { ${NODE_CLASS_NAME}Node as NodeComponent } from './node'
export { ${NODE_CLASS_NAME}Panel as PanelComponent } from './panel'
export { ${NODE_NAME}Default as defaultConfig } from './default'
export { nodeType, manifest }

export const nodeType = manifest.node_type
EOF

# Create frontend types.ts
echo -e "${GREEN}📝 Creating frontend/types.ts...${NC}"
cat > "$NODE_DIR/frontend/types.ts" << EOF
/**
 * Type definitions for $NODE_DISPLAY_NAME Node
 */

import type { CustomNodeData } from '../../../sdk/typescript/src/types'

export interface ${NODE_CLASS_NAME}NodeData extends CustomNodeData {
  type: '$NODE_NAME'
  input_text: string
}
EOF

# Create frontend node.tsx
echo -e "${GREEN}📝 Creating frontend/node.tsx...${NC}"
cat > "$NODE_DIR/frontend/node.tsx" << EOF
/**
 * $NODE_DISPLAY_NAME Node - Canvas Component
 */

import React from 'react'
import type { FC } from 'react'
import type { NodeProps } from '../../../sdk/typescript/src/types'
import type { ${NODE_CLASS_NAME}NodeData } from './types'

export const ${NODE_CLASS_NAME}Node: FC<NodeProps<${NODE_CLASS_NAME}NodeData>> = ({ data }) => {
  const { input_text } = data

  if (!input_text) return null

  return (
    <div className="mb-1 px-3 py-1">
      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
        {input_text}
      </div>
    </div>
  )
}

export default React.memo(${NODE_CLASS_NAME}Node)
EOF

# Create frontend panel.tsx
echo -e "${GREEN}📝 Creating frontend/panel.tsx...${NC}"
cat > "$NODE_DIR/frontend/panel.tsx" << EOF
/**
 * $NODE_DISPLAY_NAME Node - Configuration Panel
 */

import React from 'react'
import type { FC } from 'react'
import { useConfig } from './use-config'
import type { NodePanelProps } from '../../../sdk/typescript/src/types'
import type { ${NODE_CLASS_NAME}NodeData } from './types'

export const ${NODE_CLASS_NAME}Panel: FC<NodePanelProps<${NODE_CLASS_NAME}NodeData>> = ({ id, data }) => {
  const { inputs, handleFieldChange } = useConfig(id, data)

  return (
    <div className="mt-2">
      <div className="space-y-4 px-4 pb-4">
        {/* TODO: Add configuration fields */}
        <div>
          <label className="block text-sm font-medium mb-2">Input Text</label>
          <input
            type="text"
            value={inputs.input_text || ''}
            onChange={(e) => handleFieldChange('input_text')(e.target.value)}
            placeholder="Enter text..."
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>
    </div>
  )
}

export default React.memo(${NODE_CLASS_NAME}Panel)
EOF

# Create frontend use-config.ts
echo -e "${GREEN}📝 Creating frontend/use-config.ts...${NC}"
cat > "$NODE_DIR/frontend/use-config.ts" << EOF
/**
 * Configuration hook for $NODE_DISPLAY_NAME Node
 */

import { useCallback, useState } from 'react'
import { produce } from 'immer'
import type { ${NODE_CLASS_NAME}NodeData } from './types'
import type { UseConfigReturn } from '../../../sdk/typescript/src/types'

export const useConfig = (
  id: string,
  payload: ${NODE_CLASS_NAME}NodeData
): UseConfigReturn<${NODE_CLASS_NAME}NodeData> => {
  const [inputs, setInputs] = useState<${NODE_CLASS_NAME}NodeData>(payload)

  const handleFieldChange = useCallback(
    (field: keyof ${NODE_CLASS_NAME}NodeData) => {
      return (value: any) => {
        const newInputs = produce(inputs, (draft) => {
          ;(draft as any)[field] = value
        })
        setInputs(newInputs)
      }
    },
    [inputs, id]
  )

  const handleBulkChange = useCallback(
    (changes: Partial<${NODE_CLASS_NAME}NodeData>) => {
      const newInputs = produce(inputs, (draft) => {
        Object.assign(draft, changes)
      })
      setInputs(newInputs)
    },
    [inputs, id]
  )

  return {
    inputs,
    readOnly: false,
    handleFieldChange,
    handleBulkChange,
  }
}
EOF

# Create frontend default.ts
echo -e "${GREEN}📝 Creating frontend/default.ts...${NC}"
cat > "$NODE_DIR/frontend/default.ts" << EOF
/**
 * Default configuration for $NODE_DISPLAY_NAME Node
 */

import type { NodeDefault, ValidationResult } from '../../../sdk/typescript/src/types'
import { VarType } from '../../../sdk/typescript/src/types'
import type { ${NODE_CLASS_NAME}NodeData } from './types'

export const ${NODE_NAME}Default: NodeDefault<${NODE_CLASS_NAME}NodeData> = {
  defaultValue: {
    title: '$NODE_DISPLAY_NAME',
    desc: 'Custom node',
    type: '$NODE_NAME',
    input_text: '',
  },

  checkValid(payload: ${NODE_CLASS_NAME}NodeData, t: any): ValidationResult {
    if (!payload.input_text || payload.input_text.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Input text is required',
      }
    }

    return {
      isValid: true,
    }
  },

  getOutputVars(payload: ${NODE_CLASS_NAME}NodeData) {
    return [
      {
        variable: 'output_text',
        type: VarType.String,
        description: 'Sample output',
      },
    ]
  },
}
EOF

# Create README.md
echo -e "${GREEN}📝 Creating README.md...${NC}"
cat > "$NODE_DIR/README.md" << EOF
# $NODE_DISPLAY_NAME Custom Node

TODO: Add description

## Features

- TODO: List features

## Configuration

### Inputs

- **Input Text** (required): TODO: Describe input

### Outputs

- \`output_text\` (string): TODO: Describe output

## Usage

TODO: Add usage examples

## Dependencies

Backend:
- None yet

Frontend:
- \`react\`
- \`immer\`

## License

MIT
EOF

# Summary
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              ✅ Custom Node Created!                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Node created at:${NC} ${YELLOW}$NODE_DIR${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo -e "  1. ${GREEN}Edit the node implementation:${NC}"
echo -e "     ${YELLOW}$NODE_DIR/backend/node.py${NC}"
echo ""
echo -e "  2. ${GREEN}Customize the UI components:${NC}"
echo -e "     ${YELLOW}$NODE_DIR/frontend/node.tsx${NC}"
echo -e "     ${YELLOW}$NODE_DIR/frontend/panel.tsx${NC}"
echo ""
echo -e "  3. ${GREEN}Update the manifest:${NC}"
echo -e "     ${YELLOW}$NODE_DIR/manifest.json${NC}"
echo ""
echo -e "  4. ${GREEN}Test your node:${NC}"
echo -e "     ${YELLOW}cd $PATCHER_ROOT${NC}"
echo -e "     ${YELLOW}./installer/install.sh --target ../dify --mode dev${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
