const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase with error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
} catch (error) {
  console.error("Supabase initialization error:", error.message);
}

exports.handler = async (event) => {
  try {
    console.log("Testing Appeal Builder system setup...");

    // Test 1: Check if appeals column exists
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'entitlements')
      .eq('column_name', 'appeals');

    if (columnsError) {
      throw new Error(`Error checking appeals column: ${columnsError.message}`);
    }

    const appealsColumnExists = columns && columns.length > 0;

    // Test 2: Check if appeal-documents storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }

    const appealBucketExists = buckets.some(bucket => bucket.id === 'appeal-documents');

    // Test 3: Check if transactions table exists
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id')
      .limit(1);

    const transactionsTableExists = !transactionsError || transactionsError.code !== 'PGRST116';

    // Test 4: Check if webhook_errors table exists
    const { data: webhookErrors, error: webhookErrorsError } = await supabase
      .from('webhook_errors')
      .select('id')
      .limit(1);

    const webhookErrorsTableExists = !webhookErrorsError || webhookErrorsError.code !== 'PGRST116';

    // Test 5: Check environment variables
    const envVars = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
    };

    // Test 6: Test entitlements table access
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('entitlements')
      .select('email, appeals')
      .limit(1);

    const entitlementsAccessible = !entitlementsError;

    // Compile results
    const results = {
      timestamp: new Date().toISOString(),
      tests: {
        appeals_column_exists: appealsColumnExists,
        appeal_documents_bucket_exists: appealBucketExists,
        transactions_table_exists: transactionsTableExists,
        webhook_errors_table_exists: webhookErrorsTableExists,
        entitlements_table_accessible: entitlementsAccessible,
        environment_variables: envVars
      },
      status: 'success',
      summary: {
        total_tests: 6,
        passed: [
          appealsColumnExists,
          appealBucketExists,
          transactionsTableExists,
          webhookErrorsTableExists,
          entitlementsAccessible,
          Object.values(envVars).every(Boolean)
        ].filter(Boolean).length,
        failed: [
          appealsColumnExists,
          appealBucketExists,
          transactionsTableExists,
          webhookErrorsTableExists,
          entitlementsAccessible,
          Object.values(envVars).every(Boolean)
        ].filter(Boolean => !Boolean).length
      }
    };

    // Add recommendations
    const recommendations = [];
    
    if (!appealsColumnExists) {
      recommendations.push("Run the database migration: supabase/complete_appeal_builder_setup.sql");
    }
    
    if (!appealBucketExists) {
      recommendations.push("Create the appeal-documents storage bucket");
    }
    
    if (!transactionsTableExists) {
      recommendations.push("Create the transactions table for payment logging");
    }
    
    if (!webhookErrorsTableExists) {
      recommendations.push("Create the webhook_errors table for debugging");
    }
    
    if (!entitlementsAccessible) {
      recommendations.push("Check entitlements table permissions");
    }
    
    const missingEnvVars = Object.entries(envVars)
      .filter(([key, exists]) => !exists)
      .map(([key]) => key);
    
    if (missingEnvVars.length > 0) {
      recommendations.push(`Set missing environment variables: ${missingEnvVars.join(', ')}`);
    }

    results.recommendations = recommendations;

    console.log("Appeal Builder system test completed:", results);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results)
    };

  } catch (err) {
    console.error("Appeal Builder system test failed:", {
      message: err.message,
      stack: err.stack
    });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        error: err.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

