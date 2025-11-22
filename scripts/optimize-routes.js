// scripts/optimize-routes.js
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const routesDir = 'server/api'

// Template for optimized routes
const createOptimizedRoute = (controllerName, methodName, params = [], hasBody = false, hasQuery = false) => {
  const paramNames = params.map(p => p.replace('[', '').replace(']', ''))
  const paramGetters = paramNames.map(p => `  const ${p} = getRouterParam(event, '${p}');`).join('\n')
  const depth = params.length + 2
  const relativePath = '../'.repeat(depth)

  return `// Optimized route with dynamic imports
export default defineEventHandler(async (event) => {
${paramGetters}
  ${hasBody ? 'const body = await readBody(event)' : ''}
  ${hasQuery ? 'const query = getQuery(event)' : ''}
  
  const req = { ${[
    paramNames.length > 0 ? `params: { ${paramNames.join(', ')} }` : null,
    hasBody ? 'body' : null,
    hasQuery ? 'query' : null
  ].filter(Boolean).join(', ')} }
  
  const res = {
    status: (code) => ({ json: (data) => ({ statusCode: code, ...data }) }),
    json: (data) => data
  }

  try {
    // Dynamic import for better code splitting
    const { ${controllerName} } = await import('${relativePath}controllers/${controllerName.toLowerCase()}')
    return await ${controllerName}.${methodName}(req, res)
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})`
}

// Route definitions
const routes = [
  // Core routes that need optimization
  ['server/api/posts/index.get.js', 'PostController', 'getPosts', [], false, true],
  ['server/api/posts/index.post.js', 'PostController', 'createPost', [], true],
  ['server/api/trades/active.get.js', 'TradeController', 'getActiveTrades', [], false, true],
  ['server/api/wallets/user/[userId].get.js', 'WalletController', 'getUserWallets', ['userId']],
  ['server/api/pews/user/[userId].get.js', 'PewController', 'getUserPews', ['userId'], false, true],
  // Add more critical routes here
]

// Generate optimized routes
routes.forEach(([filePath, controllerName, methodName, params, hasBody, hasQuery]) => {
  const content = createOptimizedRoute(controllerName, methodName, params, hasBody, hasQuery)
  writeFileSync(filePath, content)
  console.log(`✅ Optimized: ${filePath}`)
})

console.log('🚀 Route optimization complete!')
