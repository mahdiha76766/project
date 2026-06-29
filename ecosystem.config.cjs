/** PM2 / cPanel — startup file: server.js */
module.exports = {
  apps: [
    {
      name: 'nedico.net',
      script: './server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        HOSTNAME: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
