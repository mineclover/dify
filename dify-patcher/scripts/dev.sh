#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCHER_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║         Dify Custom Nodes - Development Mode             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Starting development environment...${NC}"
echo ""

# Check if SDKs are installed
echo -e "${BLUE}Checking SDKs...${NC}"

if [ -d "$PATCHER_ROOT/sdk/python" ]; then
  echo -e "  ${GREEN}✓${NC} Python SDK found"
  if ! python3 -c "import dify_custom_nodes" 2>/dev/null; then
    echo -e "  ${YELLOW}⚠${NC} Installing Python SDK..."
    cd "$PATCHER_ROOT/sdk/python" && pip install -e . && cd - > /dev/null
  fi
else
  echo -e "  ${YELLOW}⚠${NC} Python SDK not found"
fi

if [ -d "$PATCHER_ROOT/sdk/typescript" ]; then
  echo -e "  ${GREEN}✓${NC} TypeScript SDK found"
  if [ ! -d "$PATCHER_ROOT/sdk/typescript/node_modules" ]; then
    echo -e "  ${YELLOW}⚠${NC} Installing TypeScript SDK dependencies..."
    cd "$PATCHER_ROOT/sdk/typescript" && pnpm install && cd - > /dev/null
  fi
else
  echo -e "  ${YELLOW}⚠${NC} TypeScript SDK not found"
fi

echo ""
echo -e "${GREEN}✅ Development environment ready!${NC}"
echo ""
echo -e "${BLUE}Available commands:${NC}"
echo -e "  ${YELLOW}./scripts/create-node.sh <node-name>${NC}  - Create new custom node"
echo -e "  ${YELLOW}./installer/install.sh --mode dev${NC}      - Install to Dify (dev mode)"
echo ""
echo -e "${BLUE}Example workflow:${NC}"
echo -e "  ${GREEN}1.${NC} Create a new node:   ${YELLOW}./scripts/create-node.sh my-node${NC}"
echo -e "  ${GREEN}2.${NC} Edit implementation: ${YELLOW}nodes/my-node/backend/node.py${NC}"
echo -e "  ${GREEN}3.${NC} Install to Dify:     ${YELLOW}./installer/install.sh --target ../dify --mode dev${NC}"
echo -e "  ${GREEN}4.${NC} Test in Dify UI"
echo ""
