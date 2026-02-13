// Jest setup file to handle cleanup of HTTP connections
afterAll(async () => {
    // Wait a short time for any pending HTTP requests to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clean up HTTP/HTTPS global agents to prevent open handles
    const http = require('http');
    const https = require('https');
    
    // Destroy global agents to close any keep-alive connections
    if (http.globalAgent && typeof http.globalAgent.destroy === 'function') {
        http.globalAgent.destroy();
    }
    if (https.globalAgent && typeof https.globalAgent.destroy === 'function') {
        https.globalAgent.destroy();
    }
});
