process.env.NODE_ENV = 'production';
const { spawnSync } = require('child_process');
const nextBin = require.resolve('next/dist/bin/next');
const result = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});
process.exit(result.status ?? 1);
