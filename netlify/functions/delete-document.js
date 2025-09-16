const { supabase, getUserFromAuth } = require("./utils/auth");

exports.handler = async (event) => {
  try {
    const user = await getUserFromAuth(event);
    const { id, fileName } = JSON.parse(event.body);

    if (!id || !fileName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
    }

    await supabase.storage.from("claim-docs").remove([fileName]);
    await supabase.from("documents").delete().eq("id", id).eq("email", user.email);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("delete-document error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
