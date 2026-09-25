const path = require('path');

const backendPort = process.env.BACKEND_PORT || '3011';
const backendHost = process.env.BACKEND_HOST || '127.0.0.1';

module.exports = {
  apps: [
    {
      name: 'coffee-leaders-backend',
      cwd: path.join(__dirname, 'backend'),
      script: 'dist/src/server.js',
      node_args: '--max-old-space-size=512',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      env: {
        NODE_ENV: 'production',
        HOST: backendHost,
        PORT: backendPort,
      },
    },
  ],
};
