const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    // Parse request body with error handling
    let requestData = {};
    try {
      if (event.body) {
        requestData = JSON.parse(event.body);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: "Invalid JSON in request body",
          success: false 
        })
      };
    }
    
    const { content, type, title, metadata } = requestData;

    if (!content) return { statusCode: 400, body: JSON.stringify({ error: "Missing content" }) };

    // Insert draft with additional metadata
    const draftData = {
      email: user.email,
      content,
      type: type || 'claim_response',
      title: title || `Draft - ${new Date().toLocaleDateString()}`,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };
    
    await supabase.from("drafts").insert(draftData);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("save-draft error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
