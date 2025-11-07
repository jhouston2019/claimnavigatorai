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
    const q = (event.queryStringParameters?.q || '').toLowerCase();
    
    // Resolve path relative to project root (netlify/functions -> project root -> data)
    const file = path.resolve(__dirname, '../../data/insurers.csv');
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(list)
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

