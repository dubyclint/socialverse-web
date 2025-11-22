// scripts/bundle-analyzer.js
import { execSync } from 'child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

console.log('📊 Bundle Analysis Starting...\n')

// Run Nuxt analyze
try {
  console.log('🔍 Running Nuxt bundle analysis...')
  execSync('npx nuxi analyze', { stdio: 'inherit' })
} catch (error) {
  console.log('⚠️  Nuxt analyze failed, continuing with manual analysis...')
}

// Manual bundle size analysis
function analyzeDirectory(dir, basePath = '') {
  const items = []
  
  if (!existsSync(dir)) return items
  
  const files = readdirSync(dir)
  
  files.forEach(file => {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    const relativePath = join(basePath, file)
    
    if (stat.isDirectory()) {
      items.push(...analyzeDirectory(filePath, relativePath))
    } else {
      items.push({
        path: relativePath,
        size: stat.size,
        sizeKB: Math.round(stat.size / 1024 * 100) / 100
      })
    }
  })
  
  return items
}

// Analyze build output
const buildDir = '.output'
if (existsSync(buildDir)) {
  console.log('\n📦 Build Output Analysis:')
  
  // Analyze client bundle
  const clientFiles = analyzeDirectory(join(buildDir, 'public/_nuxt'))
  const serverFiles = analyzeDirectory(join(buildDir, 'server'))
  
  // Sort by size
  clientFiles.sort((a, b) => b.size - a.size)
  serverFiles.sort((a, b) => b.size - a.size)
  
  console.log('\n🎨 Client Bundle (Top 10):')
  clientFiles.slice(0, 10).forEach(file => {
    const indicator = file.sizeKB > 500 ? '🔴' : file.sizeKB > 100 ? '🟡' : '🟢'
    console.log(`${indicator} ${file.path}: ${file.sizeKB} KB`)
  })
  
  console.log('\n⚙️  Server Bundle (Top 10):')
  serverFiles.slice(0, 10).forEach(file => {
    const indicator = file.sizeKB > 500 ? '🔴' : file.sizeKB > 100 ? '🟡' : '🟢'
    console.log(`${indicator} ${file.path}: ${file.sizeKB} KB`)
  })
  
  // Calculate totals
  const totalClientSize = clientFiles.reduce((sum, file) => sum + file.sizeKB, 0)
  const totalServerSize = serverFiles.reduce((sum, file) => sum + file.sizeKB, 0)
  
  console.log('\n📊 Summary:')
  console.log(`Client Bundle: ${Math.round(totalClientSize)} KB`)
  console.log(`Server Bundle: ${Math.round(totalServerSize)} KB`)
  console.log(`Total Size: ${Math.round(totalClientSize + totalServerSize)} KB`)
  
  // Recommendations
  console.log('\n💡 Optimization Recommendations:')
  if (totalClientSize > 1000) {
    console.log('🔴 Client bundle is large (>1MB). Consider:')
    console.log('   • Dynamic imports for heavy components')
    console.log('   • Code splitting by routes')
    console.log('   • Tree shaking unused code')
  }
  
  const largeFiles = clientFiles.filter(f => f.sizeKB > 200)
  if (largeFiles.length > 0) {
    console.log('🟡 Large files detected:')
    largeFiles.forEach(file => {
      console.log(`   • ${file.path} (${file.sizeKB} KB)`)
    })
  }
} else {
  console.log('❌ No build output found. Run "npm run build" first.')
}

console.log('\n✅ Bundle analysis complete!')
