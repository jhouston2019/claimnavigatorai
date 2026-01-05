const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { content, filename } = JSON.parse(event.body);

    if (!content) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing content parameter' }),
      };
    }

    // Launch Puppeteer with Chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Create HTML content with proper styling
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                line-height: 1.6;
                margin: 1in;
                color: #000;
            }
            h1, h2, h3 {
                color: #1e40af;
                margin-top: 20px;
                margin-bottom: 10px;
            }
            h1 {
                font-size: 18pt;
                text-align: center;
                border-bottom: 2px solid #1e40af;
                padding-bottom: 10px;
            }
            h2 {
                font-size: 14pt;
            }
            h3 {
                font-size: 12pt;
            }
            p {
                margin-bottom: 10px;
            }
            .header-info {
                margin-bottom: 20px;
                padding: 10px;
                background-color: #f8fafc;
                border-left: 4px solid #1e40af;
            }
            .signature-section {
                margin-top: 40px;
                border-top: 1px solid #ccc;
                padding-top: 20px;
            }
            @media print {
                body { margin: 0.5in; }
            }
        </style>
    </head>
    <body>
        <div class="content">
            ${content.replace(/\n/g, '<br>')}
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Claim Navigator Document Generator</div>',
      footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Generated on ' + new Date().toLocaleDateString() + '</div>'
    });

    await browser.close();

    // Return PDF as base64
    const base64Pdf = pdf.toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'document.pdf'}"`,
        'Content-Length': pdf.length.toString(),
      },
      body: base64Pdf,
      isBase64Encoded: true,
    };

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to generate PDF',
        details: error.message,
      }),
    };
  }
};
