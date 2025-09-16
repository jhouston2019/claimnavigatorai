const { getBlob } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  // Verify Netlify Identity authentication
  if (!context.clientContext?.user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Authentication required" })
    };
  }

  try {
    const { confirmation, userId } = JSON.parse(event.body);
    
    // Verify the user is deleting their own data
    if (userId !== context.clientContext.user.sub) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "You can only delete your own data" })
      };
    }

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_DATA_PERMANENTLY') {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: "Confirmation required. Send 'DELETE_MY_DATA_PERMANENTLY' to confirm deletion." 
        })
      };
    }

    const userSub = context.clientContext.user.sub;
    let deletionResults = {
      entitlements: { deleted: 0, errors: 0 },
      responses: { deleted: 0, errors: 0 },
      accessLogs: { deleted: 0, errors: 0 },
      templates: { deleted: 0, errors: 0 }
    };

    // Delete user entitlements
    try {
      const entitlementsStore = getBlob('entitlements');
      const userEntitlements = await entitlementsStore.list({ prefix: userSub });
      
      for (const entitlement of userEntitlements.blobs) {
        try {
          await entitlementsStore.delete(entitlement.key);
          deletionResults.entitlements.deleted++;
        } catch (error) {
          console.error(`Failed to delete entitlement ${entitlement.key}:`, error);
          deletionResults.entitlements.errors++;
        }
      }
    } catch (error) {
      console.error('Error accessing entitlements store:', error);
      deletionResults.entitlements.errors++;
    }

    // Delete user responses
    try {
      const responsesStore = getBlob('responses');
      const userResponses = await responsesStore.list({ prefix: userSub });
      
      for (const response of userResponses.blobs) {
        try {
          await responsesStore.delete(response.key);
          deletionResults.responses.deleted++;
        } catch (error) {
          console.error(`Failed to delete response ${response.key}:`, error);
          deletionResults.responses.errors++;
        }
      }
    } catch (error) {
      console.error('Error accessing responses store:', error);
      deletionResults.responses.errors++;
    }

    // Delete user access logs
    try {
      const accessLogsStore = getBlob('access-logs');
      const userAccessLogs = await accessLogsStore.list({ prefix: userSub });
      
      for (const log of userAccessLogs.blobs) {
        try {
          await accessLogsStore.delete(log.key);
          deletionResults.accessLogs.deleted++;
        } catch (error) {
          console.error(`Failed to delete access log ${log.key}:`, error);
          deletionResults.accessLogs.errors++;
        }
      }
    } catch (error) {
      console.error('Error accessing access logs store:', error);
      deletionResults.accessLogs.errors++;
    }

    // Delete user-generated templates (if any)
    try {
      const templatesStore = getBlob('templates');
      const userTemplates = await templatesStore.list({ prefix: userSub });
      
      for (const template of userTemplates.blobs) {
        try {
          await templatesStore.delete(template.key);
          deletionResults.templates.deleted++;
        } catch (error) {
          console.error(`Failed to delete template ${template.key}:`, error);
          deletionResults.templates.errors++;
        }
      }
    } catch (error) {
      console.error('Error accessing templates store:', error);
      deletionResults.templates.errors++;
    }

    // Log the deletion for audit purposes
    try {
      const auditStore = getBlob('audit-logs');
      await auditStore.set(`deletion-${userSub}-${Date.now()}`, JSON.stringify({
        userId: userSub,
        action: 'USER_DATA_DELETION',
        timestamp: new Date().toISOString(),
        results: deletionResults,
        userEmail: context.clientContext.user.email || 'unknown'
      }));
    } catch (auditError) {
      console.error('Failed to log audit trail:', auditError);
    }

    const totalDeleted = Object.values(deletionResults).reduce((sum, category) => sum + category.deleted, 0);
    const totalErrors = Object.values(deletionResults).reduce((sum, category) => sum + category.errors, 0);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "User data deletion completed",
        results: deletionResults,
        summary: {
          totalDeleted,
          totalErrors,
          success: totalErrors === 0
        },
        warning: "This action cannot be undone. All user data has been permanently removed."
      })
    };

  } catch (error) {
    console.error('Delete user data error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete user data" })
    };
  }
};
