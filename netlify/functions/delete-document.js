const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { id, fileName, email } = JSON.parse(event.body);

    if (!id || !fileName || !email) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Missing fields' }) };
    }

    // 1. Delete from Supabase storage
    const { error: storageError } = await supabase.storage
      .from('claim-docs')
      .remove([fileName]);

    if (storageError) throw storageError;

    // 2. Delete from Supabase table
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('email', email);

    if (dbError) throw dbError;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("delete-document error:", err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
