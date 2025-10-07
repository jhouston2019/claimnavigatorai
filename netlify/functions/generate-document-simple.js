// Redirect to the actual generate-response function
const { handler: generateResponseHandler } = require('./generate-response');

exports.handler = generateResponseHandler;