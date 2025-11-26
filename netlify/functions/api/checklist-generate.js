/**
 * API Endpoint: /checklist/generate
 * Generates checklist tasks for a claim
 */

const { getSupabaseClient, sendSuccess, sendError, validateSchema } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId } = event;
    const supabase = getSupabaseClient();

    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    // Validate input
    const schema = {
      claim_id: { required: false, type: 'string' }
    };

    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return sendError(validation.errors[0].message, 'CN-1000', 400);
    }

    const claimId = body.claim_id || `claim-${Date.now()}`;

    // Load claim context (similar to checklist-engine.js)
    const context = {
      stage: 'unknown',
      deadlines: [],
      alerts: [],
      evidenceSummary: {},
      timelineSummary: [],
      fnolSubmitted: false,
      complianceStatus: {},
      contractorEstimate: null
    };

    // Load deadlines
    const { data: deadlines } = await supabase
      .from('deadlines')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('date', { ascending: true });

    context.deadlines = (deadlines || []).map(d => ({
      id: d.id,
      date: d.date,
      label: d.label,
      type: d.type || 'deadline',
      description: d.notes || d.description
    }));

    // Load alerts
    const { data: alerts } = await supabase
      .from('compliance_alerts')
      .select('*')
      .eq('user_id', userId)
      .is('resolved_at', null)
      .order('severity', { ascending: false });

    context.alerts = alerts || [];

    // Load evidence summary
    const { data: evidence } = await supabase
      .from('evidence_items')
      .select('category, mime_type')
      .eq('user_id', userId);

    const photoCount = (evidence || []).filter(e => e.mime_type?.startsWith('image/')).length;
    const categories = new Set((evidence || []).map(e => e.category).filter(Boolean));
    const commonTypes = ['photos', 'invoices', 'estimates', 'police_reports', 'repair_receipts'];
    const missingTypes = commonTypes.filter(type => !Array.from(categories).some(c => c.toLowerCase().includes(type)));

    context.evidenceSummary = {
      photoCount: photoCount,
      totalCount: evidence?.length || 0,
      categories: Array.from(categories),
      missingTypes: missingTypes
    };

    // Check FNOL status
    const { data: fnol } = await supabase
      .from('fnol_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    context.fnolSubmitted = fnol && fnol.length > 0;

    // Generate tasks using checklist generator logic
    // (Simplified version - full logic in checklist-generator.js)
    const tasks = [];

    if (!context.fnolSubmitted) {
      tasks.push({
        id: 'task_fnol_submit',
        title: 'Submit FNOL (First Notice of Loss)',
        description: 'Complete and submit your First Notice of Loss to your insurance carrier.',
        dueDate: new Date().toISOString().split('T')[0],
        severity: 'critical',
        category: 'fnol'
      });
    }

    // Add deadline tasks
    context.deadlines.forEach(deadline => {
      if (!deadline.date) return;
      const deadlineDate = new Date(deadline.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntil = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil >= 0 && daysUntil <= 7) {
        tasks.push({
          id: `task_deadline_${deadline.id}`,
          title: `Follow up before ${deadline.label} deadline`,
          description: `Deadline: ${deadlineDate.toLocaleDateString()}`,
          dueDate: deadline.date,
          severity: daysUntil <= 3 ? 'critical' : 'recommended',
          category: 'deadlines'
        });
      }
    });

    // Add evidence gap tasks
    if (context.evidenceSummary.missingTypes.length > 0) {
      context.evidenceSummary.missingTypes.forEach(missingType => {
        tasks.push({
          id: `task_upload_${missingType.toLowerCase().replace(/\s+/g, '_')}`,
          title: `Upload ${missingType}`,
          description: `Add ${missingType} to your evidence collection.`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          severity: 'recommended',
          category: 'evidence'
        });
      });
    }

    return sendSuccess({
      claim_id: claimId,
      tasks: tasks,
      task_count: tasks.length,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Checklist Generate API Error:', error);
    
    try {
      return sendError('Failed to generate checklist', 'CN-5000', 500, { errorType: error.name });
    } catch (fallbackError) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          data: null,
          error: {
            code: 'CN-9000',
            message: 'Critical system failure'
          }
        })
      };
    }
  }
};

