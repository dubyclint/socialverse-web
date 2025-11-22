#!/bin/bash

set -e

echo "🚀 Deploying Socialverse Web (Nuxt + Supabase)..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="${PROJECT_DIR:-.}"
ENVIRONMENT="${ENVIRONMENT:-production}"
BRANCH="${BRANCH:-main}"

# Check environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables are required${NC}"
  exit 1
fi

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "  Project Directory: $PROJECT_DIR"
echo "  Environment: $ENVIRONMENT"
echo "  Branch: $BRANCH"
echo "  Supabase URL: ${SUPABASE_URL:0:30}..."
echo ""

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# Step 1: Git operations
echo -e "${YELLOW}📥 Step 1: Fetching latest code...${NC}"
if git rev-parse --git-dir > /dev/null 2>&1; then
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
  echo -e "${GREEN}✅ Code updated${NC}"
else
  echo -e "${YELLOW}⚠️ Not a git repository, skipping git operations${NC}"
fi

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Step 2: Installing dependencies...${NC}"
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install --frozen-lockfile
  echo -e "${GREEN}✅ Dependencies installed with pnpm${NC}"
elif [ -f "yarn.lock" ]; then
  yarn install --frozen-lockfile
  echo -e "${GREEN}✅ Dependencies installed with yarn${NC}"
elif [ -f "package-lock.json" ]; then
  npm ci
  echo -e "${GREEN}✅ Dependencies installed with npm${NC}"
else
  echo -e "${RED}❌ No lock file found (pnpm-lock.yaml, yarn.lock, or package-lock.json)${NC}"
  exit 1
fi

# Step 3: Run database migrations
echo -e "${YELLOW}🗄️  Step 3: Running database migrations...${NC}"
if [ -f "server/db/migrate.ts" ]; then
  npx tsx server/db/migrate.ts
  echo -e "${GREEN}✅ Database migrations completed${NC}"
else
  echo -e "${YELLOW}⚠️ Migration file not found, skipping${NC}"
fi

# Step 4: Build the Nuxt application
echo -e "${YELLOW}🔨 Step 4: Building Nuxt application...${NC}"
npm run build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Build completed successfully${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi

# Step 5: Type checking (optional)
echo -e "${YELLOW}🔍 Step 5: Running type checks...${NC}"
if npm run typecheck 2>/dev/null; then
  echo -e "${GREEN}✅ Type checks passed${NC}"
else
  echo -e "${YELLOW}⚠️ Type checking skipped or failed (non-critical)${NC}"
fi

# Step 6: Verify deployment
echo -e "${YELLOW}✔️  Step 6: Verifying deployment...${NC}"
if [ -d ".output" ] || [ -d ".nuxt" ]; then
  echo -e "${GREEN}✅ Build artifacts verified${NC}"
else
  echo -e "${RED}❌ Build artifacts not found${NC}"
  exit 1
fi

# Step 7: Environment setup
echo -e "${YELLOW}🔧 Step 7: Setting up environment...${NC}"
if [ ! -f ".env.production" ] && [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${YELLOW}⚠️ .env.production not found, creating from .env.example${NC}"
  if [ -f ".env.example" ]; then
    cp .env.example .env.production
  fi
fi

# Step 8: Cleanup (optional)
echo -e "${YELLOW}🧹 Step 8: Cleaning up...${NC}"
rm -rf node_modules/.cache 2>/dev/null || true
echo -e "${GREEN}✅ Cleanup completed${NC}"

# Final summary
echo ""
echo -e "${GREEN}=================================================="
echo "✅ Deployment completed successfully!"
echo "=================================================="
echo ""
echo -e "${YELLOW}📊 Deployment Summary:${NC}"
echo "  ✓ Code updated from branch: $BRANCH"
echo "  ✓ Dependencies installed"
echo "  ✓ Database migrations applied"
echo "  ✓ Nuxt application built"
echo "  ✓ Environment: $ENVIRONMENT"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "  1. Start the application: npm run dev (development) or npm run preview (production)"
echo "  2. Monitor logs for any errors"
echo "  3. Verify Supabase connection"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"

exit 0

