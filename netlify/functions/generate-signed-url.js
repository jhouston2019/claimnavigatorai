const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    const { fileName } = JSON.parse(event.body);

    if (!fileName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fileName" }) };
    }

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(fileName, 600); // 10 min

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ url: data.signedUrl }) };
  } catch (err) {
    console.error("Signed URL Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate signed URL." }) };
  }
};
