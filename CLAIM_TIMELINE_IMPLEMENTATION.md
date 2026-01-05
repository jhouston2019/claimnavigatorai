# 📅 Claim Timeline & Sequence Implementation Guide

## Overview

This implementation adds a comprehensive 12-month claim timeline and sequence tracking system to Claim Navigator. The system provides visual progress tracking, milestone management, deadline monitoring, and export capabilities.

## 🏗️ System Architecture

### Database Schema
- **claim_timeline_phases**: 8 phases covering the 12-month claim process
- **claim_timeline_milestones**: Key actions and tasks within each phase
- **claim_timeline_deadlines**: Critical statutory and policy deadlines
- **claim_timeline_actions**: User actions and custom tasks

### Key Features
- **Visual Timeline**: Interactive phase progression with color-coded status
- **Checklist Mode**: Task-oriented view with completion tracking
- **Deadline Monitoring**: Critical timing trap alerts
- **Export Functionality**: PDF, CSV, and JSON export options
- **Real-time Updates**: Automatic status updates based on claim age

## 📁 Files Created/Modified

### New Files
```
supabase/claim-timeline-schema.sql          # Database schema
app/timeline.html                           # Timeline dashboard
netlify/functions/timeline-api.js           # Timeline CRUD API
netlify/functions/export-timeline.js        # Export functionality
CLAIM_TIMELINE_IMPLEMENTATION.md            # This guide
```

### Modified Files
```
app/claim.html                              # Added timeline tool
netlify/functions/stripe-webhook.js         # Timeline initialization
_redirects                                  # Timeline routing
```

## 🚀 Setup Instructions

### 1. Database Setup

Run the timeline schema migration:
```sql
-- Execute supabase/claim-timeline-schema.sql
-- This creates all timeline tables and functions
```

### 2. Environment Variables

Ensure these are set in Netlify:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "pdfkit": "^0.13.0"
  }
}
```

### 4. Deploy Functions

Deploy the new Netlify functions:
```bash
netlify functions:deploy timeline-api
netlify functions:deploy export-timeline
```

## 📊 Timeline Phases

### Phase 1: Immediate Response (Day 0-7) 🟢
- **Color**: Green (#22c55e)
- **Key Actions**:
  - Secure safety & document damages
  - File insurance claim
  - Get claim number & adjuster assignment

### Phase 2: Early Claim Development (Day 8-28) 🟡
- **Color**: Yellow (#eab308)
- **Key Actions**:
  - Adjuster assignment
  - Preliminary documentation
  - Initial evidence gathering

### Phase 3: Initial Investigation & Offer (Day 29-60) 🟠
- **Color**: Orange (#f97316)
- **Key Actions**:
  - Adjuster inspection
  - Initial settlement offer
  - Coverage review

### Phase 4: Negotiation & Supplemental Evidence (Day 61-120) 🔵
- **Color**: Blue (#3b82f6)
- **Key Actions**:
  - Counter-offers
  - Supplemental claims
  - Additional documentation

### Phase 5: Escalation Pathways (Day 121-180) 🟣
- **Color**: Purple (#8b5cf6)
- **Key Actions**:
  - Appeals
  - Appraisal process
  - Mediation/arbitration

### Phase 6: Legal Consideration (Day 181-270) 🔴
- **Color**: Red (#ef4444)
- **Key Actions**:
  - Attorney consultation
  - Bad faith claims
  - Legal preparation

### Phase 7: Litigation Prep (Day 271-365) 🟤
- **Color**: Brown (#a855f7)
- **Key Actions**:
  - Lawsuit filing
  - Discovery process
  - Trial preparation

### Phase 8: Resolution & Recovery (Day 366+) ⚫
- **Color**: Gray (#6b7280)
- **Key Actions**:
  - Settlement finalization
  - Fund release
  - Recovery process

## 🎯 Critical Deadlines

### Statutory Deadlines
- **Proof of Loss**: 60 days (some states 90)
- **Insurer Response**: 30-60 days
- **Appeal Filing**: 30-90 days after denial
- **Statute of Limitations**: 1-2 years (varies by state)

### Policy Deadlines
- **Mortgage Company Sign-off**: 30-60 days delay if not managed
- **Additional Documentation**: Varies by insurer
- **Supplemental Claims**: Usually 30-60 days

## 🔧 API Endpoints

### Timeline API (`/.netlify/functions/timeline-api`)

#### GET - Retrieve Timeline Data
```javascript
GET /.netlify/functions/timeline-api?claim_id=uuid&type=full
```

**Response**:
```json
{
  "phases": [...],
  "milestones": [...],
  "deadlines": [...],
  "actions": [...]
}
```

#### POST - Create Timeline Items
```javascript
POST /.netlify/functions/timeline-api
{
  "type": "milestone",
  "data": {
    "milestone_name": "Custom Task",
    "milestone_description": "Description",
    "due_day": 30,
    "is_critical": false
  }
}
```

#### PUT - Update Timeline Items
```javascript
PUT /.netlify/functions/timeline-api
{
  "type": "milestone",
  "id": "milestone_uuid",
  "data": {
    "is_completed": true,
    "completed_at": "2025-01-15T10:30:00Z"
  }
}
```

### Export API (`/.netlify/functions/export-timeline`)

#### POST - Export Timeline
```javascript
POST /.netlify/functions/export-timeline
{
  "claim_id": "uuid",
  "format": "pdf" // or "csv" or "json"
}
```

## 🎨 User Interface

### Timeline View
- **Visual Progress**: Color-coded phases with progress bars
- **Status Indicators**: Pending, In Progress, Completed, Overdue
- **Milestone Tracking**: Checkbox completion system
- **Deadline Alerts**: Critical timing warnings

### Checklist View
- **Task-Oriented**: Focus on actionable items
- **Due Date Tracking**: Visual deadline indicators
- **Completion Status**: Real-time progress updates
- **Critical Items**: Highlighted urgent tasks

### Export Options
- **PDF**: Professional timeline document
- **CSV**: Data analysis and reporting
- **JSON**: System integration and backup

## 🔄 Integration Points

### Claim Dashboard Integration
- Timeline tool added to claim dashboard
- Direct navigation to timeline view
- Checklist mode access

### Automatic Initialization
- Timeline created when claim is paid
- All phases and milestones pre-populated
- Critical deadlines automatically set

### Real-time Updates
- Status updates based on claim age
- Deadline monitoring and alerts
- Progress tracking across phases

## 📈 Usage Examples

### 1. View Timeline Progress
```javascript
// Navigate to timeline
window.location.href = `/app/timeline.html?id=${claimId}`;

// Switch to checklist view
window.location.href = `/app/timeline.html?id=${claimId}&view=checklist`;
```

### 2. Update Milestone Status
```javascript
// Toggle milestone completion
await supabase
  .from('claim_timeline_milestones')
  .update({ is_completed: true, completed_at: new Date().toISOString() })
  .eq('id', milestoneId);
```

### 3. Export Timeline
```javascript
// Export as PDF
const response = await fetch('/.netlify/functions/export-timeline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ claim_id: claimId, format: 'pdf' })
});
```

## 🚨 Critical Timing Traps

### Immediate Actions (Day 0-1)
- Take timestamped photos/videos
- Secure property and safety
- Contact emergency services if needed

### Early Documentation (Day 1-3)
- File insurance claim
- Get claim number
- Save all receipts

### Critical Deadlines
- **Proof of Loss**: Must be filed within 60 days
- **Insurer Response**: 30-60 days depending on state
- **Appeal Window**: 30-90 days after denial
- **Statute of Limitations**: 1-2 years for lawsuit

## 🔧 Customization Options

### Phase Customization
- Modify phase durations
- Add custom phases
- Adjust color schemes
- Update descriptions

### Milestone Management
- Add custom milestones
- Set critical priorities
- Adjust due dates
- Add notes and descriptions

### Deadline Configuration
- Add state-specific deadlines
- Customize statutory requirements
- Set policy-specific timelines
- Configure alert thresholds

## 📊 Analytics & Reporting

### Progress Tracking
- Phase completion rates
- Milestone achievement
- Deadline compliance
- User engagement metrics

### Export Analytics
- Most exported formats
- Timeline usage patterns
- User completion rates
- Critical deadline alerts

## 🛠️ Maintenance & Updates

### Regular Tasks
- Update timeline status based on claim age
- Monitor deadline compliance
- Generate progress reports
- Clean up completed items

### System Monitoring
- Track API usage
- Monitor export requests
- Check timeline initialization
- Verify deadline calculations

## 🎯 Future Enhancements

### Planned Features
- **AI Timeline Advisor**: Smart recommendations based on claim type
- **Integration Alerts**: Email/SMS notifications for critical deadlines
- **Collaborative Features**: Multi-user timeline management
- **Advanced Analytics**: Detailed progress insights and reporting

### Customization Options
- **State-Specific Rules**: Jurisdiction-based deadline adjustments
- **Insurance Company Profiles**: Carrier-specific timeline variations
- **Claim Type Templates**: Specialized timelines for different loss types
- **User Preferences**: Personalized timeline configurations

## 📞 Support & Troubleshooting

### Common Issues
1. **Timeline not initializing**: Check database schema and function deployment
2. **Export failures**: Verify PDF generation dependencies
3. **Status not updating**: Check timeline status update function
4. **Access denied**: Verify claim ownership and authentication

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify Supabase connection and authentication
3. Test API endpoints directly
4. Check Netlify function logs
5. Verify database permissions and RLS policies

## 🎉 Success Metrics

### User Engagement
- Timeline page views
- Checklist completions
- Export downloads
- Milestone achievements

### System Performance
- API response times
- Export generation speed
- Database query efficiency
- User satisfaction scores

This comprehensive timeline system transforms Claim Navigator into a complete claim management platform, providing users with clear guidance, progress tracking, and deadline management throughout their entire insurance claim journey.
