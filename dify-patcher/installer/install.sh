#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TARGET_DIR="../"
MODE="docker"
SKIP_PATCHES=false

# Banner
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     Dify Custom Nodes Patcher & Installer v1.0          ║
║                                                           ║
║     Zero-Fork Plugin Architecture for Dify               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --target)
      TARGET_DIR="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --skip-patches)
      SKIP_PATCHES=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --target DIR       Target Dify directory (default: ../)"
      echo "  --mode MODE        Installation mode: docker|dev (default: docker)"
      echo "  --skip-patches     Skip applying patches (only setup mounts)"
      echo "  --help             Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 --target ../dify --mode docker"
      echo "  $0 --target ../dify --mode dev"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Resolve absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCHER_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Patcher Root: ${YELLOW}$PATCHER_ROOT${NC}"
echo -e "  Target Dify:  ${YELLOW}$TARGET_DIR${NC}"
echo -e "  Mode:         ${YELLOW}$MODE${NC}"
echo -e "  Skip Patches: ${YELLOW}$SKIP_PATCHES${NC}"
echo ""

# Validate Dify directory
if [ ! -d "$TARGET_DIR/api" ] || [ ! -d "$TARGET_DIR/web" ]; then
  echo -e "${RED}❌ Invalid Dify directory: $TARGET_DIR${NC}"
  echo -e "   Expected to find 'api' and 'web' subdirectories"
  exit 1
fi

# Step 1: Apply patches
if [ "$SKIP_PATCHES" = false ]; then
  echo -e "${GREEN}🔧 Step 1/3: Applying patches to Dify...${NC}"

  if ! python3 "$SCRIPT_DIR/patcher.py" --target "$TARGET_DIR" --patches "$SCRIPT_DIR/patches"; then
    echo -e "${RED}❌ Failed to apply patches${NC}"
    exit 1
  fi

  echo -e "${GREEN}✅ Patches applied successfully${NC}"
  echo ""
else
  echo -e "${YELLOW}⏭️  Step 1/3: Skipping patches (--skip-patches flag set)${NC}"
  echo ""
fi

# Step 2: Setup mounts
echo -e "${GREEN}🔗 Step 2/3: Setting up custom nodes mount...${NC}"

if ! python3 "$SCRIPT_DIR/mount.py" --target "$TARGET_DIR" --patcher-root "$PATCHER_ROOT" --mode "$MODE"; then
  echo -e "${RED}❌ Failed to setup mounts${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Mounts configured successfully${NC}"
echo ""

# Step 3: Install SDKs
echo -e "${GREEN}📚 Step 3/3: Installing SDKs...${NC}"

# Python SDK
if [ -d "$PATCHER_ROOT/sdk/python" ]; then
  echo -e "  ${BLUE}Installing Python SDK...${NC}"
  if command -v uv &> /dev/null; then
    cd "$PATCHER_ROOT/sdk/python" && uv pip install -e . && cd - > /dev/null
  else
    cd "$PATCHER_ROOT/sdk/python" && pip install -e . && cd - > /dev/null
  fi
  echo -e "  ${GREEN}✅ Python SDK installed${NC}"
fi

# TypeScript SDK
if [ -d "$PATCHER_ROOT/sdk/typescript" ]; then
  echo -e "  ${BLUE}Installing TypeScript SDK...${NC}"
  if command -v pnpm &> /dev/null; then
    cd "$PATCHER_ROOT/sdk/typescript" && pnpm install && pnpm build && cd - > /dev/null
  elif command -v npm &> /dev/null; then
    cd "$PATCHER_ROOT/sdk/typescript" && npm install && npm run build && cd - > /dev/null
  else
    echo -e "  ${YELLOW}⚠️  No package manager found (pnpm/npm), skipping TypeScript SDK${NC}"
  fi
  echo -e "  ${GREEN}✅ TypeScript SDK installed${NC}"
fi

echo ""

# Success message
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                  ✅ Installation Complete!                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Next steps
echo -e "${BLUE}Next Steps:${NC}"
echo ""

if [ "$MODE" = "docker" ]; then
  echo -e "  1. Enable custom nodes in Dify environment:"
  echo -e "     ${YELLOW}echo 'CUSTOM_NODES_ENABLED=true' >> $TARGET_DIR/docker/.env${NC}"
  echo -e ""
  echo -e "  2. Start Dify with Docker Compose:"
  echo -e "     ${YELLOW}cd $TARGET_DIR/docker${NC}"
  echo -e "     ${YELLOW}docker-compose up -d${NC}"
  echo -e ""
  echo -e "  3. Check logs for loaded custom nodes:"
  echo -e "     ${YELLOW}docker-compose logs -f api | grep 'custom node'${NC}"

elif [ "$MODE" = "dev" ]; then
  echo -e "  1. Enable custom nodes in Dify environment:"
  echo -e "     ${YELLOW}echo 'CUSTOM_NODES_ENABLED=true' >> $TARGET_DIR/.env${NC}"
  echo -e "     ${YELLOW}echo 'NEXT_PUBLIC_CUSTOM_NODES_ENABLED=true' >> $TARGET_DIR/web/.env.local${NC}"
  echo -e ""
  echo -e "  2. Start Dify backend:"
  echo -e "     ${YELLOW}cd $TARGET_DIR${NC}"
  echo -e "     ${YELLOW}uv run --project api python -m flask run${NC}"
  echo -e ""
  echo -e "  3. Start Dify frontend (in another terminal):"
  echo -e "     ${YELLOW}cd $TARGET_DIR/web${NC}"
  echo -e "     ${YELLOW}pnpm dev${NC}"
  echo -e ""
  echo -e "  4. Create your first custom node:"
  echo -e "     ${YELLOW}cd $PATCHER_ROOT${NC}"
  echo -e "     ${YELLOW}./scripts/create-node.sh my-awesome-node${NC}"
fi

echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
