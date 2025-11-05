const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Path to content/posts directory
    const postsDir = path.join(process.cwd(), 'content', 'posts');
    
    // Check if directory exists, if not, return empty array
    if (!fs.existsSync(postsDir)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ posts: [] })
      };
    }

    // Read all markdown files in the posts directory
    const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
    
    const posts = files.map(file => {
      try {
        const filePath = path.join(postsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract frontmatter and content
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const body = frontmatterMatch[2];
          
          // Parse frontmatter
          const metadata = {};
          frontmatter.split('\n').forEach(line => {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (match) {
              metadata[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
            }
          });
          
          // Generate slug from filename
          const slug = file.replace('.md', '');
          
          // Get snippet (first 200 characters of content)
          const snippet = body.replace(/[#*\[\]]/g, '').trim().substring(0, 200) + '...';
          
          return {
            slug,
            title: metadata.title || slug.replace(/-/g, ' '),
            snippet: metadata.snippet || snippet,
            date: metadata.date || fs.statSync(filePath).mtime.toISOString().split('T')[0],
            author: metadata.author || 'ClaimNavigator Team',
            category: metadata.category || 'General'
          };
        } else {
          // No frontmatter, use filename as title
          const slug = file.replace('.md', '');
          const snippet = content.replace(/[#*\[\]]/g, '').trim().substring(0, 200) + '...';
          
          return {
            slug,
            title: slug.replace(/-/g, ' '),
            snippet,
            date: fs.statSync(filePath).mtime.toISOString().split('T')[0],
            author: 'ClaimNavigator Team',
            category: 'General'
          };
        }
      } catch (err) {
        console.warn(`Error reading file ${file}:`, err);
        return null;
      }
    }).filter(post => post !== null);

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ posts })
    };

  } catch (error) {
    console.error('Error getting posts:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message
      })
    };
  }
};

