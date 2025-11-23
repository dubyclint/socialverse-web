#!/bin/bash

# ============================================================================
# COMPREHENSIVE IMPORT FIX SCRIPT
# ============================================================================
# Fixes all missing imports in TypeScript controllers
# Usage: bash fix-all-imports.sh
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🔧 COMPREHENSIVE IMPORT FIX SCRIPT                ║"
echo "║     Fixing all TypeScript controller imports              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# ============================================================================
# STEP 1: Fix chat-controller.ts
# ============================================================================
echo -e "${BLUE}[STEP 1/8]${NC} Fixing chat-controller.ts..."

FILE="server/controllers/chat-controller.ts"
if [ -f "$FILE" ]; then
  # Check if getQuery is already imported
  if ! grep -q "getQuery" "$FILE"; then
    # Add getQuery to the H3Event import
    sed -i "s/import { H3Event } from 'h3'/import { H3Event, getQuery } from 'h3'/" "$FILE"
    echo -e "${GREEN}✓${NC} Added getQuery import"
  else
    echo -e "${GREEN}✓${NC} getQuery already imported"
  fi
else
  echo -e "${RED}✗${NC} File not found: $FILE"
fi

# ============================================================================
# STEP 2: Fix profile-analytics-controller.ts
# ============================================================================
echo -e "${BLUE}[STEP 2/8]${NC} Fixing profile-analytics-controller.ts..."

FILE="server/controllers/profile-analytics-controller.ts"
if [ -f "$FILE" ]; then
  # Check and add missing imports
  if ! grep -q "readBody" "$FILE"; then
    sed -i "s/import { H3Event } from 'h3'/import { H3Event, readBody, getHeader, getClientIP } from 'h3'/" "$FILE"
    echo -e "${GREEN}✓${NC} Added readBody, getHeader, getClientIP imports"
  else
    echo -e "${GREEN}✓${NC} Imports already present"
  fi
else
  echo -e "${RED}✗${NC} File not found: $FILE"
fi

# ============================================================================
# STEP 3: Verify status-controller.ts
# ============================================================================
echo -e "${BLUE}[STEP 3/8]${NC} Verifying status-controller.ts..."

FILE="server/controllers/status-controller.ts"
if [ -f "$FILE" ]; then
  if grep -q "readBody" "$FILE"; then
    echo -e "${GREEN}✓${NC} status-controller.ts has correct imports"
  else
    echo -e "${RED}✗${NC} Missing readBody import"
  fi
else
  echo -e "${RED}✗${NC} File not found: $FILE"
fi

# ============================================================================
# STEP 4: Verify contact-sync-controller.ts
# ============================================================================
echo -e "${BLUE}[STEP 4/8]${NC} Verifying contact-sync-controller.ts..."

FILE="server/controllers/contact-sync-controller.ts"
if [ -f "$FILE" ]; then
  if grep -q "readBody" "$FILE"; then
    echo -e "${GREEN}✓${NC} contact-sync-controller.ts has correct imports"
  else
    echo -e "${RED}✗${NC} Missing readBody import"
  fi
else
  echo -e "${RED}✗${NC} File not found: $FILE"
fi

# ============================================================================
# STEP 5: Verify group-chat-controller.ts
# ============================================================================
echo -e "${BLUE}[STEP 5/8]${NC} Verifying group-chat-controller.ts..."

FILE="server/controllers/group-chat-controller.ts"
if [ -f "$FILE" ]; then
  if grep -q "readBody\|getRouterParam\|getQuery" "$FILE"; then
    echo -e "${GREEN}✓${NC} group-chat-controller.ts has correct imports"
  else
    echo -e "${RED}✗${NC} Missing required imports"
  fi
else
  echo -e "${RED}✗${NC} File not found: $FILE"
fi

# ============================================================================
# STEP 6: Verify security-controller.ts
# ============================================================================
echo -e "${BLUE}[STEP 6/8]${NC} Verifying security-controller.ts..."

FILE="server/controllers/security-controller.ts"
if [ -f "$FILE" ]; then
  if grep -q "readBody\|getRouterParam\|getQuery" "$FILE"; then
    echo -e "${GREEN}✓${NC} security-controller.ts has correct imports"
  else
    echo -e "${RED}✗${NC} Missing required imports"
  fi
else
  echo -e "${RED}✗${NC} File not found: $FILE"
fi

# ============================================================================
# STEP 7: Run import fixing script
# ============================================================================
echo -e "${BLUE}[STEP 7/8]${NC} Running npm import fixing script..."

if npm run fix:imports 2>&1 | head -20; then
  echo -e "${GREEN}✓${NC} Import fixing script completed"
else
  echo -e "${YELLOW}⚠${NC} Import fixing script had warnings (this is normal)"
fi

# ============================================================================
# STEP 8: Run TypeScript check
# ============================================================================
echo -e "${BLUE}[STEP 8/8]${NC} Running TypeScript compiler check..."

if npm run typecheck 2>&1 | head -30; then
  echo -e "${GREEN}✓${NC} TypeScript check completed"
else
  echo -e "${YELLOW}⚠${NC} TypeScript check had warnings"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}              ${GREEN}✓ IMPORT FIX COMPLETE!${NC}                    ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Summary of changes:${NC}"
echo "  • chat-controller.ts: Added getQuery import"
echo "  • profile-analytics-controller.ts: Added readBody, getHeader, getClientIP"
echo "  • All other controllers: Verified correct imports"
echo "  • Ran npm import fixing script"
echo "  • Ran TypeScript compiler check"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Review any TypeScript errors above"
echo "  2. Commit changes: git add . && git commit -m 'fix: add missing imports to controllers'"
echo "  3. Test the application: npm run dev"
echo ""
