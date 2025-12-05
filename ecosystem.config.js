module.exports = {
  apps: [
    // Frontend (React)
    {
      name: "frontend",
      cwd: ".",
      script: "npm",
      args: "start",
      watch: ["src", "public"],
      ignore_watch: ["node_modules", "build", "coverage"],
      env: {
        NODE_ENV: "development",
        HOST: "0.0.0.0",
        PORT: 3100,
        BROWSER: "none",
        PUBLIC_URL: "http://92.124.137.137:3100"
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/frontend-error.log",
      out_file: "logs/frontend-out.log"
    },
    // Backend (Node.js)
    {
      name: "backend",
      cwd: "./backend",
      script: "npm",
      args: "run dev",
      watch: ["src", "prisma"],
      ignore_watch: ["node_modules", "dist"],
      env: {
        NODE_ENV: "development",
        HOST: "0.0.0.0",
        PORT: 3011,
        CORS_ORIGIN: "http://92.124.137.137:3100"
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "../logs/backend-error.log",
      out_file: "../logs/backend-out.log"
    }
  ]
};
