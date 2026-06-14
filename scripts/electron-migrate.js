const { execFileSync } = require('child_process');
const path = require('path');

function runMigrations(appRoot) {
  const prismaCli = path.join(appRoot, 'node_modules', 'prisma', 'build', 'index.js');
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: appRoot,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: 'inherit',
  });
}

if (require.main === module) {
  const appRoot = process.env.NEXT_APP_DIR || process.cwd();
  runMigrations(appRoot);
}

module.exports = { runMigrations };
