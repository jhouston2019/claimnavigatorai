const fs = require('fs');
const path = require('path');

function csvToJson(csv) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map(h => h.trim());
  return lines
    .filter(line => line.trim().length > 0) // Filter out empty lines
    .map(line => {
      const cols = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"' && line[i + 1] !== '"') { inQ = !inQ; continue; }
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
        if (c === ',' && !inQ) { cols.push(cur); cur = ''; continue; }
        cur += c;
      }
      cols.push(cur);
      const obj = {};
      headers.forEach((h, idx) => obj[h] = (cols[idx] || '').trim());
      return obj;
    });
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
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
    const q = (event.queryStringParameters?.q || '').toLowerCase();
    
    // When bundled on Netlify, __dirname points to the function folder.
    // Package insurers.csv inside netlify/functions/data so it ships with the function.
    const file = path.join(__dirname, 'data', 'insurers.csv');
    
    // Check if file exists
    if (!fs.existsSync(file)) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Insurers data file not found' })
      };
    }
    
    const csv = fs.readFileSync(file, 'utf8');
    let list = csvToJson(csv);

    if (q) {
      list = list.filter(r =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.brand || '').toLowerCase().includes(q)
      );
    }

    // sort by name
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(list)
    };
  } catch (err) {
    console.error('Error in get-insurers:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
};

