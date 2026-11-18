// Load defineConfig from vite.
const { defineConfig } = require('vite');

// Export the build settings Vite will use.
module.exports = defineConfig({
  // Register the plugin that prepares the HTML for production.
  plugins: [{
    // Give the build plugin a name for diagnostics.
    name: 'bundle-site-script',
    // Run this plugin only for production builds.
    apply: 'build',
    // Customize the HTML before Vite processes it.
    transformIndexHtml: {
      // Run this HTML transform before other build processing.
      order: 'pre',
      // Take the original page HTML as input.
      handler(html) {
        // Convert the script to a module so Vite bundles it.
        const bundled = html.replace('<script src="js/site.js" defer></script>', '<script type="module" src="/js/site.js"></script>');
        // Read the optional AWS endpoint from the build environment.
        const endpoint = process.env.BASED_CONTACT_ENDPOINT;
        // Keep the relative form route when building without an AWS endpoint.
        if (!endpoint) return bundled;
        // Accept only a us-east-1 API Gateway URL for the contact route.
        if (!/^https:\/\/[a-z0-9]+\.execute-api\.us-east-1\.amazonaws\.com\/api\/contact$/.test(endpoint)) {
          // Stop the build rather than deploy an invalid form destination.
          throw new Error('BASED_CONTACT_ENDPOINT must be the AWS contact stack output.');
        // Close the current block or expression.
        }
        // Point the production form at the supplied AWS endpoint.
        return bundled.replace('action="/api/contact"', `action="${endpoint}"`);
      // Close the current block or expression.
      },
    // Close the current block or expression.
    },
  // Close the current block or expression.
  }],
// Close the current block or expression.
});
