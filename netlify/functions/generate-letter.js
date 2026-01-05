const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { mode, situation, documentType, claimData, userInput } = JSON.parse(event.body);
    
    if (!mode || !documentType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing required parameters: mode and documentType' })
      };
    }

    // File mapping for document types
    const fileMap = {
      "Appeal Letter": "AppealLetter.txt",
      "Demand Letter": "DemandLetter.txt",
      "Notice of Delay Complaint": "NoticeOfDelayComplaint.txt",
      "Coverage Clarification Request": "CoverageClarificationRequest.txt",
      "Proof of Repairs Submission": "ProofOfRepairsSubmission.txt",
      "Proof of Loss": "ProofOfLoss.txt",
      "Supplemental Proof of Loss": "SupplementalProofOfLoss.txt",
      "Appraisal Demand Letter": "AppraisalDemandLetter.txt",
      "Claim Summary Letter": "ClaimSummaryLetter.txt",
      "Clarification Request": "ClarificationRequest.txt",
      "Regulatory Complaint": "RegulatoryComplaint.txt",
      "Damage Inventory Sheet": "DamageInventorySheet.txt",
      "ALE Expense Log": "ALEExpenseLog.txt"
    };

    // Load template
    const fname = fileMap[documentType] || `${documentType.replace(/\s+/g, '')}.txt`;
    // For Netlify functions, templates should be in a data directory or passed in
    // Since we can't access filesystem easily, use a fallback template
    let template = '';
    try {
      // Try to load from a relative path (may not work in Netlify)
      const templatePath = path.join(__dirname, '../../assets/templates/letters', fname);
      template = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Template not found:', templatePath);
      // Fallback template if specific template not found
      template = `CLAIM INFORMATION
================
Policyholder: {{name}}
Address: {{address}}
Policy Number: {{policy}}
Claim Number: {{claim}}
Date: {{date}}

Generated: {{date}}
Document Type: ${documentType}

========================================

[Your Name]
[Your Address]
[City, State ZIP Code]
[Date]

[Insurance Company Name]
[Claims Department Address]
[City, State ZIP Code]

Re: Policy Number {{policy}} - Claim Number {{claim}}
${documentType}

Dear Claims Adjuster,

I am writing regarding my insurance claim referenced above.

**Situation Summary:**
{{situation_summary}}

[Document content will be generated based on the specific situation and user input.]

Sincerely,

[Your Name]
[Your Phone Number]
[Your Email Address]`;
    }

    // Inject claim data into template
    const filledTemplate = template
      .replace(/{{name}}/g, claimData?.name || '[Your Name]')
      .replace(/{{policy}}/g, claimData?.policy || '[Policy Number]')
      .replace(/{{claim}}/g, claimData?.claim || '[Claim Number]')
      .replace(/{{address}}/g, claimData?.address || '[Your Address]')
      .replace(/{{date}}/g, new Date().toLocaleDateString())
      .replace(/{{situation_summary}}/g, situation || 'No specific situation provided');

    // AI mode logic
    if (mode === "ai") {
      const openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });

      const prompt = `You are Claim Navigator, an expert insurance claim advisor. 

Using this standard ${documentType} template as a foundation, create a customized, professional letter that incorporates the user's specific situation and input.

**Template to use as foundation:**
${filledTemplate}

**User's specific situation:**
${situation || 'No specific situation provided'}

**User's additional input:**
${userInput || 'No additional input provided'}

**Instructions:**
1. Use the template structure and format as a foundation
2. Customize the content to address the user's specific situation
3. Incorporate the user's input naturally into the letter
4. Maintain a professional, assertive tone appropriate for insurance communications
5. Keep the header and footer structure intact
6. Ensure the letter is ready to send (no placeholder text)
7. Make it specific and actionable for the user's situation

Return the complete, customized letter text.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      });

      const aiText = response.choices[0].message.content.trim();
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          data: {
            text: aiText,
            mode: 'ai',
            documentType: documentType
          },
          error: null
        })
      };
    }

    // Standard mode - return filled template
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          text: filledTemplate,
          mode: 'standard',
          documentType: documentType
        },
        error: null
      })
    };

  } catch (error) {
    console.error('Generate Letter Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message || 'Failed to generate letter' }
      })
    };
  }
};