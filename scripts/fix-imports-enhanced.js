#!/usr/bin/env node

// FILE: /scripts/fix-imports-enhanced.js
// ============================================================================
// ENHANCED IMPORT FIX SCRIPT - TypeScript Controller Conversion
// Fixes all imports from JavaScript controllers to new TypeScript versions
// ============================================================================

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║  🔧 ENHANCED IMPORT FIX SCRIPT - TypeScript Conversion    ║
║  Updating all controller imports to new TypeScript files  ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

// Define import patterns to fix
const patterns = [
  // ========== CONTROLLER IMPORTS ==========
  {
    name: 'Security Controller (JS to TS)',
    from: /from\s+['"]([^'"]*\/security-controller\.js)['"]/g,
    to: "from '~/server/controllers/security-controller'"
  },
  {
    name: 'Status Controller (JS to TS)',
    from: /from\s+['"]([^'"]*\/status-controller\.js)['"]/g,
    to: "from '~/server/controllers/status-controller'"
  },
  {
    name: 'Contact Sync Controller (JS to TS)',
    from: /from\s+['"]([^'"]*\/contact-sync-controller\.js)['"]/g,
    to: "from '~/server/controllers/contact-sync-controller'"
  },
  {
    name: 'Group Chat Controller (JS to TS)',
    from: /from\s+['"]([^'"]*\/group-chat-controller\.js)['"]/g,
    to: "from '~/server/controllers/group-chat-controller'"
  },
  
  // ========== RELATIVE CONTROLLER IMPORTS ==========
  {
    name: 'Relative Security Controller imports',
    from: /from\s+['"](\.\.\/)+(server\/)?controllers\/security-controller\.js['"]/g,
    to: "from '~/server/controllers/security-controller'"
  },
  {
    name: 'Relative Status Controller imports',
    from: /from\s+['"](\.\.\/)+(server\/)?controllers\/status-controller\.js['"]/g,
    to: "from '~/server/controllers/status-controller'"
  },
  {
    name: 'Relative Contact Sync Controller imports',
    from: /from\s+['"](\.\.\/)+(server\/)?controllers\/contact-sync-controller\.js['"]/g,
    to: "from '~/server/controllers/contact-sync-controller'"
  },
  {
    name: 'Relative Group Chat Controller imports',
    from: /from\s+['"](\.\.\/)+(server\/)?controllers\/group-chat-controller\.js['"]/g,
    to: "from '~/server/controllers/group-chat-controller'"
  },

  // ========== CLASS IMPORTS ==========
  {
    name: 'SecurityController class imports',
    from: /import\s+{\s*SecurityController\s*}\s+from\s+['"]([^'"]*security-controller\.js)['"]/g,
    to: "import { SecurityController } from '~/server/controllers/security-controller'"
  },
  {
    name: 'StatusController class imports',
    from: /import\s+{\s*StatusController\s*}\s+from\s+['"]([^'"]*status-controller\.js)['"]/g,
    to: "import { StatusController } from '~/server/controllers/status-controller'"
  },
  {
    name: 'ContactSyncController class imports',
    from: /import\s+{\s*ContactSyncController\s*}\s+from\s+['"]([^'"]*contact-sync-controller\.js)['"]/g,
    to: "import { ContactSyncController } from '~/server/controllers/contact-sync-controller'"
  },
  {
    name: 'GroupChatController class imports',
    from: /import\s+{\s*GroupChatController\s*}\s+from\s+['"]([^'"]*group-chat-controller\.js)['"]/g,
    to: "import { GroupChatController } from '~/server/controllers/group-chat-controller'"
  },

  // ========== MODEL IMPORTS (Standardize) ==========
  {
    name: 'Model imports standardization',
    from: /from\s+['"]([^'"]*\/models\/[^'"]+)\.js['"]/g,
    to: (match, importPath) => {
      const fileName = path.basename(importPath);
      return `from '~/server/models/${fileName}'`;
    }
  },

  // ========== UTILITY IMPORTS (Standardize) ==========
  {
    name: 'Utility imports standardization',
    from: /from\s+['"]([^'"]*\/utils\/[^'"]+)\.js['"]/g,
    to: (match, importPath) => {
      const fileName = path.basename(importPath);
      return `from '~/server/utils/${fileName}'`;
    }
  },

  // ========== RELATIVE IMPORTS FIX ==========
  {
    name: 'Fix relative model imports',
    from: /from\s+['"](\.\.\/)+(models\/[^'"]+)['"]/g,
    to: (match, importPath) => {
      const fileName = path.basename(importPath);
      return `from '~/server/models/${fileName}'`;
    }
  },
  {
    name: 'Fix relative controller imports',
    from: /from\s+['"](\.\.\/)+(controllers\/[^'"]+)['"]/g,
    to: (match, importPath) => {
      const fileName = path.basename(importPath);
      return `from '~/server/controllers/${fileName}'`;
    }
  },
  {
    name: 'Fix relative utils imports',
    from: /from\s+['"](\.\.\/)+(utils\/[^'"]+)['"]/g,
    to: (match, importPath) => {
      const fileName = path.basename(importPath);
      return `from '~/server/utils/${fileName}'`;
    }
  }
];

// Files to search (exclude node_modules and build directories)
const fileGlobs = [
  'server/**/*.{ts,js}',
  'composables/**/*.{ts,js}',
  'utils/**/*.{ts,js}',
  'stores/**/*.{ts,js}',
  'plugins/**/*.{ts,js}',
  'pages/**/*.{ts,js,vue}',
  'components/**/*.{ts,js,vue}',
  'layouts/**/*.{ts,js,vue}',
  'middleware/**/*.{ts,js}',
  'app.vue'
];

const ignorePatterns = [
  'node_modules/**',
  '.nuxt/**',
  'dist/**',
  '.output/**',
  'build/**',
  '.git/**'
];

// Get all files to process
let allFiles = [];
fileGlobs.forEach(globPattern => {
  const files = glob.sync(globPattern, {
    ignore: ignorePatterns
  });
  allFiles = allFiles.concat(files);
});

// Remove duplicates
allFiles = [...new Set(allFiles)];

console.log(`${colors.blue}📁 Found ${allFiles.length} files to check${colors.reset}\n`);

let totalFixed = 0;
let filesModified = [];
const fixedPatterns = {};

// Process each file
allFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let fileFixed = false;

    // Apply each pattern
    patterns.forEach(pattern => {
      const patternName = pattern.name;
      
      if (pattern.from.test(content)) {
        const before = content;
        
        if (typeof pattern.to === 'function') {
          content = content.replace(pattern.from, pattern.to);
        } else {
          content = content.replace(pattern.from, pattern.to);
        }
        
        if (before !== content) {
          fileFixed = true;
          totalFixed++;
          fixedPatterns[patternName] = (fixedPatterns[patternName] || 0) + 1;
        }
      }
    });

    // Write file if modified
    if (fileFixed && content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      filesModified.push(file);
      console.log(`${colors.green}✅ Fixed: ${file}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error processing ${file}: ${error.message}${colors.reset}`);
  }
});

// Summary
console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.green}✅ IMPORT FIX COMPLETE${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

console.log(`${colors.cyan}📊 SUMMARY:${colors.reset}`);
console.log(`   Total files modified: ${colors.green}${filesModified.length}${colors.reset}`);
console.log(`   Total imports fixed: ${colors.green}${totalFixed}${colors.reset}\n`);

if (Object.keys(fixedPatterns).length > 0) {
  console.log(`${colors.cyan}📋 PATTERNS FIXED:${colors.reset}`);
  Object.entries(fixedPatterns).forEach(([pattern, count]) => {
    console.log(`   ${colors.yellow}${pattern}${colors.reset}: ${colors.green}${count}${colors.reset}`);
  });
}

console.log(`\n${colors.cyan}📝 MODIFIED FILES:${colors.reset}`);
filesModified.forEach(file => {
  console.log(`   ${colors.green}✓${colors.reset} ${file}`);
});

console.log(`\n${colors.green}✨ All imports have been successfully updated!${colors.reset}\n`);
