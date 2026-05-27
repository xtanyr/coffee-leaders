// Copy .env.example to .env and set PUBLIC_URL / CORS_ORIGIN for your deployment host.
require('dotenv').config();

const frontendPort = process.env.PORT || 3100;
const backendPort = process.env.BACKEND_PORT || 3011;

const frontendEnv = {
  NODE_ENV: 'development',
  HOST: process.env.HOST || '0.0.0.0',
  PORT: frontendPort,
  BROWSER: 'none',
};

if (process.env.PUBLIC_URL) {
  frontendEnv.PUBLIC_URL = process.env.PUBLIC_URL;
}
frontendEnv.REACT_APP_API_PROXY =
  process.env.REACT_APP_API_PROXY || `http://127.0.0.1:${backendPort}`;
frontendEnv.BACKEND_PORT = String(backendPort);

const backendEnv = {
  NODE_ENV: 'development',
  HOST: process.env.BACKEND_HOST || '0.0.0.0',
  PORT: backendPort,
};

if (process.env.CORS_ORIGIN) {
  backendEnv.CORS_ORIGIN = process.env.CORS_ORIGIN;
}

module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: '.',
      script: 'npm',
      args: 'start',
      watch: ['src', 'public'],
      ignore_watch: ['node_modules', 'build', 'coverage'],
      env: frontendEnv,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
    },
    {
      name: 'backend',
      cwd: './backend',
      script: 'npm',
      args: 'run dev',
      watch: ['src', 'prisma'],
      ignore_watch: ['node_modules', 'dist'],
      env: backendEnv,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
    },
  ],
};
