const fs = require('fs');
const path = require('path');

function csvToJson(csv) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map(h => h.trim());
  return lines.map(line => {
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
  try {
    const name = (event.queryStringParameters?.name || '').toLowerCase();
    if (!name) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'name required' })
      };
    }

    // Resolve path relative to project root (netlify/functions -> project root -> data)
    const file = path.resolve(__dirname, '../../data/insurers.csv');
    const csv = fs.readFileSync(file, 'utf8');
    const list = csvToJson(csv);
    const match = list.find(r =>
      (r.name || '').toLowerCase() === name ||
      (r.brand || '').toLowerCase() === name
    );
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(match || {})
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};

