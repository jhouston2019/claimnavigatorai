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

async function getInsurersList() {
  const file = path.join(process.cwd(), 'data', 'insurers.csv');
  
  if (!fs.existsSync(file)) {
    throw new Error('Insurers data file not found');
  }
  
  const csv = fs.readFileSync(file, 'utf8');
  const list = csvToJson(csv);
  list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return list;
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const list = await getInsurersList();
    const jsonPath = path.join(process.cwd(), 'data', 'insurers.json');
    fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: 'cached',
        count: list.length,
        path: jsonPath
      })
    };
  } catch (err) {
    console.error('Error in build-insurer-cache:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
};

