// Wrapper to execute TypeScript seed script with ts-node under CommonJS
// Usage: node scripts/run-seed-notifications.cjs
// Ensures path alias @/ works via tsconfig baseUrl

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
    target: 'ES2017',
    baseUrl: '.',
    paths: { '@/*': ['*'] }
  }
})

require('./seed-notifications.ts')
