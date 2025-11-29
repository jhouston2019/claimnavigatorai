const handler = require('./generate-response.js');
exports.handler = handler.handler || handler.default || handler;