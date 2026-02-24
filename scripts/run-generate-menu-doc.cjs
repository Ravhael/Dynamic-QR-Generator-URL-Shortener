// Wrapper to run the TypeScript generator in CommonJS context without ESM loader issues
// Uses dynamic import after registering ts-node with inline compiler options.

const path = require('path');

(async () => {
  try {
    // Register ts-node programmatically with forced CommonJS for this run
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: {
        module: 'CommonJS'
      }
    });
  const scriptPath = path.join(__dirname, 'generate-menu-doc.ts');
  require(scriptPath);
  } catch (err) {
    console.error('[generate-menu-doc] Failed:', err);
    process.exit(1);
  }
})();
