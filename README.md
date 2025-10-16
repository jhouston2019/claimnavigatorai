# ClaimNavigatorAI - AI Response & Analysis Agent

A professional-grade AI-powered tool for analyzing insurer correspondence and generating expert responses for insurance claims.

## Features

- **Multiple Analysis Modes**: Standard Reply, Professional Appeal, Policy Clarification, Negotiation Strategy, Summary & Guidance
- **Smart AI Analysis**: Powered by OpenAI GPT-4o-mini for accurate, professional responses
- **PDF Export**: Generate professional PDF reports with claim information and AI analysis
- **Responsive Design**: Modern, mobile-friendly interface using TailwindCSS
- **Auto-save**: Form data is automatically saved to localStorage

## Project Structure

```
claimnavigatorai/
├── app/
│   └── ai-response-agent.html    # Frontend interface
├── netlify/
│   └── functions/
│       ├── aiResponseAgent.js    # Backend AI processing
│       └── package.json          # Function dependencies
└── README.md
```

## Deployment Instructions

### 1. Netlify Deployment

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**:
   - Build command: `echo "No build required"`
   - Publish directory: `app`
3. **Environment Variables**:
   - Add `OPENAI_API_KEY` in Netlify dashboard under Site Settings > Environment Variables

### 2. Local Development

1. **Install Dependencies**:
   ```bash
   cd netlify/functions
   npm install
   ```

2. **Set Environment Variables**:
   ```bash
   export OPENAI_API_KEY="your-openai-api-key"
   ```

3. **Run Netlify Dev** (if using Netlify CLI):
   ```bash
   netlify dev
   ```

### 3. Manual Testing

1. Open `app/ai-response-agent.html` in a web browser
2. Fill in claim information
3. Paste an insurer letter
4. Select analysis mode
5. Click "Analyze & Draft Reply"
6. Review AI-generated response
7. Export PDF if needed

## API Endpoints

### POST /.netlify/functions/aiResponseAgent

**Request Body**:
```json
{
  "mode": "reply|appeal|clarify|negotiate|summary",
  "claim": {
    "name": "Policyholder Name",
    "policyNumber": "POL-123456",
    "claimNumber": "CLM-789012",
    "dateOfLoss": "2024-01-15",
    "company": "Insurance Company",
    "phone": "+1-555-0123",
    "email": "policyholder@email.com",
    "address": "123 Main St, City, State"
  },
  "letter": "Full insurer correspondence text..."
}
```

**Response**:
```json
{
  "analysis": "Detailed analysis and reasoning",
  "issues": ["Issue 1", "Issue 2", "Issue 3"],
  "suggestions": ["Action 1", "Action 2", "Action 3"],
  "draftLetter": "Complete draft response letter",
  "metadata": {
    "mode": "reply",
    "timestamp": "2024-01-15T10:30:00Z",
    "model": "gpt-4o-mini"
  }
}
```

## Configuration

### Required Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for AI processing

### Optional Configuration

- Modify the OpenAI model in `aiResponseAgent.js` (default: `gpt-4o-mini`)
- Adjust temperature and max_tokens for different response styles
- Customize the system prompt for different analysis approaches

## Security Notes

- API keys are stored securely in Netlify environment variables
- CORS is properly configured for cross-origin requests
- Input validation prevents malicious requests
- Error handling prevents sensitive information leakage

## Browser Support

- Modern browsers with ES6+ support
- PDF export requires jsPDF library (included via CDN)
- Local storage for auto-save functionality

## Troubleshooting

### Common Issues

1. **"AI processing failed"**: Check OpenAI API key configuration
2. **CORS errors**: Ensure Netlify function is properly deployed
3. **PDF export not working**: Check browser console for jsPDF errors
4. **Form not saving**: Check browser localStorage permissions

### Debug Mode

Enable debug logging by adding `console.log` statements in the Netlify function and checking the function logs in Netlify dashboard.

## License

This project is proprietary software for ClaimNavigatorAI.