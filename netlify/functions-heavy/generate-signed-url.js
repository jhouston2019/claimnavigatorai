const { supabase, getUserFromAuth } = require("./utils/auth");
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    const { fileName } = JSON.parse(event.body);

    if (!fileName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fileName" }) };
    }

    // Check if file exists locally
    const filePath = path.join(__dirname, `../../assets/docs/${fileName}`);
    
    if (!fs.existsSync(filePath)) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: "Document not found" }) 
      };
    }

    // For local files, return a direct download URL
    // In production, you might want to serve this through a secure endpoint
    const baseUrl = process.env.URL || 'https://claimnavigatorai.netlify.app';
    const downloadUrl = `${baseUrl}/assets/docs/${fileName}`;

    return { statusCode: 200, body: JSON.stringify({ url: downloadUrl }) };
  } catch (err) {
    console.error("Signed URL Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate signed URL." }) };
  }
};
