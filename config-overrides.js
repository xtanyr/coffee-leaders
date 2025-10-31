module.exports = function override(config, env) {
  // Add fallbacks for Node.js modules that axios needs
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "http": false,
    "https": false,
    "util": false,
    "zlib": false,
    "stream": false,
    "url": false,
    "crypto": false,
    "assert": false,
    "http2": false
  };

  // Change dev server port to 6001 to avoid conflict with backend on 6000
  if (env === 'development') {
    config.devServer = {
      ...config.devServer,
      port: 6001,
    };
  }

  return config;
};