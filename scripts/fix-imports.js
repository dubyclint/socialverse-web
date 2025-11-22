// FILE: /scripts/fix-imports.js
// ============================================================================
// AUTOMATED IMPORT FIX SCRIPT - ISSUE 9 CLEANUP
// This script fixes all broken imports from deleted directories
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
  blue: '\x1b[34m'
};

console.log(`${colors.blue}🔧 Starting Import Fix Script...${colors.reset}\n`);

// Define import patterns to fix
const patterns = [
  // Pattern 1: Fix imports from deleted /models/
  {
    name: 'Models imports',
    from: /from\s+['"]([^'"]*\/models\/[^'"]*)['"]/g,
    to: (match, importPath) => {
      const fileName = path.basename(importPath);
      return `from '@/server/models/${fileName}'`;
    }
  },
  
  // Pattern 2: Fix imports from deleted /controllers/
  {
    name: 'Controllers imports',
    from: /from\s+['"]([^'"]*\/controllers\/[^'"]*)['"]/g,
    to: (match, importPath) => {
      const fileName = path.basename(importPath);
      return `from '@/server/controllers/${fileName}'`;
    }
  },
  
  // Pattern 3: Fix imports from deleted /database/
  {
    name: 'Database imports',
    from: /from\s+['"]([^'"]*\/database\/[^'"]*)['"]/g,
    to: (match, importPath) => {
      return `from '@/server/db/index'`;
    }
  },
  
  // Pattern 4: Fix relative imports from models
  {
    name: 'Relative models imports',
    from: /from\s+['"](\.\.\/)+(models\/[^'"]*)['"]/g,
    to: (match, importPath) => {
      const fileName = path.basename(importPath);
      return `from '@/server/models/${fileName}'`;
    }
  },
  
  // Pattern 5: Fix relative imports from controllers
  {
    name: 'Relative controllers imports',
    from: /from\s+['"](\.\.\/)+(controllers\/[^'"]*)['"]/g,
    to: (match, importPath) => {
      const fileName = path.basename(importPath);
      return `from '@/server/controllers/${fileName}'`;
    }
  },
  
  // Pattern 6: Fix relative imports from database
  {
    name: 'Relative database imports',
    from: /from\s+['"](\.\.\/)+(database\/[^'"]*)['"]/g,
    to: (match, importPath) => {
      return `from '@/server/db/index'`;
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
  'build/**'
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

// Process each file
allFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let fileFixed = false;

    // Apply each pattern
    patterns.forEach(pattern => {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to);
        fileFixed = true;
        totalFixed++;
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
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
console.log(`\n📊 Summary:`);
console.log(`   Total patterns fixed: ${totalFixed}`);
console.log(`   Files modified: ${filesModified.length}`);

if (filesModified.length > 0) {
  console.log(`\n📝 Modified files:`);
  filesModified.forEach(file => {
    console.log(`   - ${file}`);
  });
}

console.log(`\n${colors.yellow}⚠️  Next steps:${colors.reset}`);
console.log(`   1. Review the changes above`);
console.log(`   2. Run: npm run build`);
console.log(`   3. Run: npm run dev`);
console.log(`   4. Check browser console for errors`);
console.log(`   5. Test your application thoroughly\n`);

process.exit(0);
