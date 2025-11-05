const fs = require('fs');
const path = require('path');

// Simple markdown to HTML converter (basic implementation)
function markdownToHTML(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li>.*<\/li>\n?)+/gim, '<ul>$&</ul>');
  
  // Paragraphs (double newline)
  html = html.split('\n\n').map(para => {
    if (para.trim() && !para.match(/^<[h|u|o|l]/i)) {
      return `<p>${para.trim()}</p>`;
    }
    return para;
  }).join('\n');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
  
  // Line breaks
  html = html.replace(/\n/gim, '<br>');
  
  return html;
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'text/html'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: 'Method not allowed'
    };
  }

  try {
    const slug = event.queryStringParameters?.slug;

    if (!slug) {
      return {
        statusCode: 400,
        headers,
        body: '<p>Missing slug parameter</p>'
      };
    }

    // Path to content/posts directory
    const postsDir = path.join(process.cwd(), 'content', 'posts');
    const filePath = path.join(postsDir, `${slug}.md`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        statusCode: 404,
        headers,
        body: '<p>Post not found</p>'
      };
    }

    // Read markdown file
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract frontmatter and body
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    let title = slug.replace(/-/g, ' ');
    let body = content;
    let metadata = {};

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      body = frontmatterMatch[2];
      
      // Parse frontmatter
      frontmatter.split('\n').forEach(line => {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          metadata[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
        }
      });
      
      title = metadata.title || title;
    }

    // Convert markdown to HTML
    const htmlBody = markdownToHTML(body);

    // Generate full HTML page
    const html = `
      <article style="max-width: 800px; margin: 0 auto; padding: 2rem; color: #ffffff;">
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: #ffffff;">${title}</h1>
        ${metadata.date ? `<p style="color: #dbeafe; margin-bottom: 2rem;">Published: ${metadata.date}${metadata.author ? ` by ${metadata.author}` : ''}</p>` : ''}
        <div style="line-height: 1.8; font-size: 1.1rem; color: #ffffff;">
          ${htmlBody}
        </div>
        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.2);">
          <a href="/app/knowledge-center.html" style="color: #3b82f6; text-decoration: none;">← Back to Knowledge Center</a>
        </div>
      </article>
    `;

    return {
      statusCode: 200,
      headers,
      body: html
    };

  } catch (error) {
    console.error('Error getting post:', error);
    return {
      statusCode: 500,
      headers,
      body: `<p>Error loading post: ${error.message}</p>`
    };
  }
};

