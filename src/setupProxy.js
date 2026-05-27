const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const backendPort = process.env.BACKEND_PORT || '3011';
  const target =
    process.env.REACT_APP_API_PROXY || `http://127.0.0.1:${backendPort}`;

  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
};
