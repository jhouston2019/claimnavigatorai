# Situational Advisory Implementation

## Overview
The Situational Advisory feature provides AI-powered, personalized next-step advice based on a policyholder's current claim situation. Users input their claim stage, insurer behavior, and specific concerns to receive structured guidance.

## Features Implemented

### 1. Database Schema
- **File**: `supabase/migrations/20241215_create_advisories_table.sql`
- **Table**: `advisories`
- **Fields**: `id`, `user_id`, `input_json`, `output_json`, `lang`, `created_at`
- **Security**: Row Level Security (RLS) enabled with user-specific policies

### 2. Netlify Function
- **File**: `netlify/functions/getAdvisory.js`
- **Features**:
  - Authentication validation using Supabase
  - Stripe subscription limits (2 free/month for non-subscribers)
  - Input validation with Zod schema
  - OpenAI GPT-4 integration for advice generation
  - Bilingual support (EN/ES)
  - Advisory storage in Supabase

### 3. User Interface
- **File**: `app/situational-advisory.html`
- **Features**:
  - Responsive form with all required fields
  - Real-time language switching (EN/ES)
  - Form validation and error handling
  - AI results display with HTML rendering
  - Direct links to recommended Navigator tools
  - Professional styling with TailwindCSS

### 4. Internationalization
- **Files**: `locales/en.json`, `locales/es.json`
- **Coverage**: All UI elements, form labels, error messages, and disclaimers
- **Languages**: English and Spanish

### 5. Integration
- **Response Center**: Added "Situational Advisory" tab
- **Navigation**: Direct access from Response Center
- **Tool Integration**: Links to Document Generator, ROM Estimator, etc.

## Form Fields

### Required Fields
1. **Claim Stage**: Dropdown with 7 options
   - Filed, Under Review, Denied, Offer Made, Delayed, Disputed, Settlement Pending

2. **Insurer Behavior**: Multi-select checkboxes
   - Delayed response, Denied, Lowball offer, Misapplied exclusion, Requested excessive docs, Offered quick payout

3. **Claim Type**: Dropdown with 5 options
   - Property, Auto, Health, Business Interruption, Other

4. **User Concern**: Textarea for detailed description

### Optional Fields
5. **State**: Dropdown for state-specific advice (all 50 US states)

## AI Prompt Structure

### System Prompt (EN)
```
You are an insurance claims advisor. Given this situation, provide:
1. Next Steps (1-2 immediate actions the policyholder should take).
2. Reasoning (why these steps matter).
3. Recommended Navigator Tool (one of: Proof of Loss, Appeal Letter, Demand Letter, Notice of Delay, ROM Estimator, Policy Analyzer).
Output must be plain-language, structured in Markdown with headings.
End with disclaimer: "This advisory is AI-generated and not legal advice."
```

### System Prompt (ES)
```
Eres un asesor de reclamos de seguros. Dada esta situación, proporciona:
1. Próximos Pasos (1-2 acciones inmediatas que el asegurado debe tomar).
2. Razonamiento (por qué estos pasos importan).
3. Herramienta Recomendada del Navegador (una de: Proof of Loss, Appeal Letter, Demand Letter, Notice of Delay, ROM Estimator, Policy Analyzer).
La salida debe ser en lenguaje claro, estructurada en Markdown con encabezados.
Termina con el descargo de responsabilidad: "Este consejo fue generado por IA y no constituye asesoría legal."
```

## Example Input → Output

### Input
- **Claim Stage**: Offer Made
- **Insurer Behavior**: Lowball offer
- **Claim Type**: Property
- **User Concern**: "Contractor estimate is $95,000, insurer offered $40,000."

### AI Output
```markdown
## Next Steps

1. Submit a Demand Letter including your contractor's estimate.
2. Request written explanation for the gap between their offer and your evidence.

## Reasoning

Insurers must evaluate valid contractor estimates. Requesting written justification forces transparency and creates a record for appeal.

## Recommended Navigator Tool

Demand Letter Generator → [Open Tool]

---

*This advisory is AI-generated and not legal advice.*
```

## Technical Specifications

### OpenAI Configuration
- **Model**: GPT-4
- **Temperature**: 0.4
- **Max Tokens**: 800
- **Response Format**: Markdown with headings

### Stripe Limits
- **Free Users**: 2 advisories per month
- **Subscribers**: Unlimited advisories
- **Validation**: Monthly usage tracking

### Security
- **Authentication**: Supabase JWT tokens
- **Authorization**: User-specific data access
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Monthly advisory limits

## File Structure

```
├── supabase/migrations/
│   └── 20241215_create_advisories_table.sql
├── netlify/functions/
│   └── getAdvisory.js
├── app/
│   ├── situational-advisory.html
│   └── response-center.html (updated)
├── locales/
│   ├── en.json (updated)
│   └── es.json (updated)
└── package.json (updated)
```

## Deployment Checklist

1. ✅ Create Supabase migration
2. ✅ Implement Netlify function
3. ✅ Build responsive UI
4. ✅ Add internationalization
5. ✅ Integrate with Response Center
6. ✅ Add Zod dependency
7. ⏳ Test complete flow
8. ⏳ Deploy to production

## Testing

### Manual Testing Steps
1. Navigate to Response Center
2. Click "Situational Advisory" tab
3. Fill out form with test data
4. Submit and verify AI response
5. Test language switching
6. Verify tool recommendations work
7. Test error handling
8. Verify Stripe limits

### Test Data
```json
{
  "claimStage": "Offer Made",
  "insurerBehavior": ["Lowball offer"],
  "claimType": "Property",
  "userConcern": "Contractor estimate is $95,000, insurer offered $40,000.",
  "state": "FL",
  "lang": "en"
}
```

## Production Readiness

- ✅ Authentication integration
- ✅ Stripe subscription limits
- ✅ Input validation
- ✅ Error handling
- ✅ Internationalization
- ✅ Responsive design
- ✅ Security (RLS policies)
- ✅ Database logging
- ✅ Tool integration

## Future Enhancements

1. **State-Specific Advice**: Enhanced prompts based on state selection
2. **Historical Advisories**: View past advisories in user dashboard
3. **Advisory Analytics**: Track most common situations and outcomes
4. **Email Notifications**: Send advisory summaries via email
5. **PDF Export**: Generate PDF versions of advisories
6. **Integration with Claims**: Link advisories to specific claims
