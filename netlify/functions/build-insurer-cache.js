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

async function getInsurersList() {
  const file = path.resolve(__dirname, '../../data/insurers.csv');
  const csv = fs.readFileSync(file, 'utf8');
  const list = csvToJson(csv);
  list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return list;
}

exports.handler = async (event) => {
  try {
    const list = await getInsurersList();
    const jsonPath = path.resolve(__dirname, '../../data/insurers.json');
    fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        status: 'cached',
        count: list.length,
        path: jsonPath
      })
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

