const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');
const { createWriteStream } = require('fs');
const { promisify } = require('util');
const { pipeline } = require('stream');
const { promisify: promisifyUtil } = require('util');

const pipelineAsync = promisifyUtil(pipeline);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get user from JWT token
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const body = JSON.parse(event.body);
    const { claim_id, format } = body;

    if (!claim_id || !format) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'claim_id and format are required' })
      };
    }

    // Verify user owns the claim
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claim_id)
      .eq('user_id', user.id)
      .single();

    if (claimError || !claim) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied' })
      };
    }

    // Get timeline data
    const [phasesResult, milestonesResult, deadlinesResult] = await Promise.all([
      supabase.from('claim_timeline_phases').select('*').eq('claim_id', claim_id).order('phase_number'),
      supabase.from('claim_timeline_milestones').select('*').eq('claim_id', claim_id).order('due_day'),
      supabase.from('claim_timeline_deadlines').select('*').eq('claim_id', claim_id).order('due_day')
    ]);

    if (phasesResult.error) throw phasesResult.error;
    if (milestonesResult.error) throw milestonesResult.error;
    if (deadlinesResult.error) throw deadlinesResult.error;

    const timelineData = {
      claim,
      phases: phasesResult.data,
      milestones: milestonesResult.data,
      deadlines: deadlinesResult.data
    };

    switch (format.toLowerCase()) {
      case 'pdf':
        return await exportPDF(timelineData, headers);
      case 'csv':
        return await exportCSV(timelineData, headers);
      case 'json':
        return await exportJSON(timelineData, headers);
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unsupported format' })
        };
    }

  } catch (error) {
    console.error('Export timeline error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function exportPDF(timelineData, headers) {
  try {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {});
    
    // Header
    doc.fontSize(20).text('Claim Timeline & Sequence Guide', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Claim: ${timelineData.claim.insured_name}`, { align: 'center' });
    doc.text(`Policy #: ${timelineData.claim.policy_number}`, { align: 'center' });
    doc.text(`Insurer: ${timelineData.claim.insurer}`, { align: 'center' });
    doc.text(`Loss Date: ${new Date(timelineData.claim.date_of_loss).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    
    // Timeline phases
    doc.fontSize(16).text('Timeline Phases', { underline: true });
    doc.moveDown();
    
    timelineData.phases.forEach((phase, index) => {
      doc.fontSize(14).text(`Phase ${phase.phase_number}: ${phase.phase_name}`, { color: phase.color_code });
      doc.fontSize(10).text(`Days ${phase.start_day}-${phase.end_day} | Status: ${phase.status.replace('_', ' ').toUpperCase()}`);
      doc.text(phase.phase_description);
      doc.moveDown();
      
      // Phase milestones
      const phaseMilestones = timelineData.milestones.filter(m => m.phase_id === phase.id);
      if (phaseMilestones.length > 0) {
        doc.fontSize(12).text('Key Milestones:', { indent: 20 });
        phaseMilestones.forEach(milestone => {
          const status = milestone.is_completed ? '✓' : '○';
          doc.text(`${status} ${milestone.milestone_name}`, { indent: 40 });
          if (milestone.milestone_description) {
            doc.text(`   ${milestone.milestone_description}`, { indent: 40 });
          }
        });
        doc.moveDown();
      }
      
      // Phase deadlines
      const phaseDeadlines = timelineData.deadlines.filter(d => 
        d.due_day >= phase.start_day && d.due_day <= phase.end_day
      );
      if (phaseDeadlines.length > 0) {
        doc.fontSize(12).text('Critical Deadlines:', { indent: 20, color: 'red' });
        phaseDeadlines.forEach(deadline => {
          const status = deadline.is_missed ? '⚠️ MISSED' : '⏰';
          doc.text(`${status} ${deadline.deadline_name} (Day ${deadline.due_day})`, { indent: 40, color: deadline.is_missed ? 'red' : 'black' });
        });
        doc.moveDown();
      }
      
      if (index < timelineData.phases.length - 1) {
        doc.moveDown();
      }
    });
    
    // Critical timing traps
    doc.addPage();
    doc.fontSize(16).text('Critical Timing Traps', { underline: true });
    doc.moveDown();
    
    const criticalDeadlines = [
      'Proof of Loss → must be filed within 60 days (some states 90)',
      'Insurer response → 30–60 days depending on state',
      'Appeal filing → usually 30–90 days after denial',
      'Lawsuit filing → statute of limitations (1–2 years typical)',
      'Mortgage company sign-off → delays release of funds by 30–60 days if not managed'
    ];
    
    criticalDeadlines.forEach(deadline => {
      doc.text(`• ${deadline}`, { indent: 20 });
    });
    
    doc.end();
    
    // Wait for PDF to be generated
    await new Promise(resolve => {
      doc.on('end', resolve);
    });
    
    const pdfBuffer = Buffer.concat(chunks);
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="claim-timeline-${timelineData.claim.id}.pdf"`
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('PDF export error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate PDF' })
    };
  }
}

async function exportCSV(timelineData, headers) {
  try {
    let csv = 'Type,Phase,Name,Description,Due Day,Status,Completed\n';
    
    // Add phases
    timelineData.phases.forEach(phase => {
      csv += `Phase,${phase.phase_number},"${phase.phase_name}","${phase.phase_description}",${phase.start_day}-${phase.end_day},${phase.status},\n`;
    });
    
    // Add milestones
    timelineData.milestones.forEach(milestone => {
      const phase = timelineData.phases.find(p => p.id === milestone.phase_id);
      csv += `Milestone,${phase ? phase.phase_number : 'N/A'},"${milestone.milestone_name}","${milestone.milestone_description || ''}",${milestone.due_day},${milestone.is_completed ? 'Completed' : 'Pending'},${milestone.is_completed ? 'Yes' : 'No'}\n`;
    });
    
    // Add deadlines
    timelineData.deadlines.forEach(deadline => {
      csv += `Deadline,N/A,"${deadline.deadline_name}","${deadline.deadline_description || ''}",${deadline.due_day},${deadline.is_missed ? 'Missed' : 'Pending'},${deadline.is_missed ? 'Yes' : 'No'}\n`;
    });
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="claim-timeline-${timelineData.claim.id}.csv"`
      },
      body: csv
    };

  } catch (error) {
    console.error('CSV export error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate CSV' })
    };
  }
}

async function exportJSON(timelineData, headers) {
  try {
    const exportData = {
      claim: {
        id: timelineData.claim.id,
        insured_name: timelineData.claim.insured_name,
        policy_number: timelineData.claim.policy_number,
        insurer: timelineData.claim.insurer,
        date_of_loss: timelineData.claim.date_of_loss,
        type_of_loss: timelineData.claim.type_of_loss,
        property_type: timelineData.claim.property_type
      },
      timeline: {
        phases: timelineData.phases,
        milestones: timelineData.milestones,
        deadlines: timelineData.deadlines
      },
      export_info: {
        generated_at: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="claim-timeline-${timelineData.claim.id}.json"`
      },
      body: JSON.stringify(exportData, null, 2)
    };

  } catch (error) {
    console.error('JSON export error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate JSON' })
    };
  }
}
