// scripts/optimize-all.js - Complete optimization runner
import { execSync } from 'child_process'

const steps = [
  {
    name: 'Fix Supabase Imports',
    command: 'node scripts/fix-supabase-imports.js'
  },
  {
    name: 'Optimize Routes',
    command: 'node scripts/optimize-routes.js'
  },
  {
    name: 'Generate Component Lazy Loaders',
    command: 'node scripts/generate-lazy-components.js'
  },
  {
    name: 'Build with Analysis',
    command: 'npm run build:analyze'
  },
  {
    name: 'Bundle Analysis',
    command: 'node scripts/bundle-analyzer.js'
  }
]

console.log('🚀 Starting Complete Optimization Process...\n')

steps.forEach((step, index) => {
  console.log(`📋 Step ${index + 1}/${steps.length}: ${step.name}`)
  
  try {
    execSync(step.command, { stdio: 'inherit' })
    console.log(`✅ ${step.name} completed\n`)
  } catch (error) {
    console.error(`❌ ${step.name} failed:`, error.message)
    console.log('⚠️  Continuing with next step...\n')
  }
})

console.log('🎉 Optimization process complete!')
console.log('📊 Check the bundle analysis results above')
console.log('🚀 Your app should now load faster and have smaller bundles')
