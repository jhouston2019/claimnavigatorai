const fs = require("fs");
const path = require("path");
const { getStore } = require("@netlify/blobs");

// Map logical template keys to on-disk paths under /assets/docs
function resolveTemplatePath(name, format) {
  const safeName = String(name || "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  const ext = format && format.toLowerCase() === "pdf" ? ".pdf" : ".docx";

  const mapping = {
    "fnol": ["property", "first-notice-of-loss"],
    "proof-of-loss": ["property", "proof-of-loss"],
    "appeal-letter": ["letters", "appeal-letter"],
    "demand-letter": ["letters", "demand-letter"],
    "estimate-request": ["requests", "estimate-request"],
    "inspection-request": ["requests", "inspection-request"],
    "umpire-request": ["requests", "umpire-request"],
    "public-adjuster-intake": ["intake", "public-adjuster-intake"],
    "contractor-scope": ["contractor", "contractor-scope"],
    "contractor-bid": ["contractor", "contractor-bid"],
    "coverage-inquiry": ["letters", "coverage-inquiry"],
    "delay-followup": ["letters", "delay-followup"],
    "bad-faith-notice": ["letters", "bad-faith-notice"],
    "appraisal-demand": ["letters", "appraisal-demand"],
    "mortgagee-proof": ["mortgage", "mortgagee-proof"],
    "ale-reimbursement": ["property", "ale-reimbursement"],
    "water-mitigation": ["property", "water-mitigation"],
    "mold-remediation": ["property", "mold-remediation"],
    "roof-replacement": ["property", "roof-replacement"],
    "supplement-request": ["property", "supplement-request"],
  };

  const parts = mapping[safeName];
  if (!parts) return null;
  return { fsPath: path.join(process.cwd(), "assets", "docs", parts[0], parts[1] + ext), parts, ext };
}

exports.handler = async (event, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const { name, format } = event.queryStringParameters || {};
    if (!name) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Missing template name" }) };
    }

    const resolved = resolveTemplatePath(name, format);
    if (!resolved) {
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Template not found" }) };
    }

    let fileBuffer;
    if (fs.existsSync(resolved.fsPath)) {
      fileBuffer = fs.readFileSync(resolved.fsPath);
    } else {
      // Fallback to Netlify Blobs store named "templates"
      const [category, base] = resolved.parts;
      const key = `${category}/${base}${resolved.ext}`;
      const store = getStore("templates");
      const blob = await store.get(key);
      if (!blob) {
        return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Template not found" }) };
      }
      fileBuffer = Buffer.from(blob);
    }

    const ext = resolved.ext.toLowerCase();
    const contentType = ext === ".pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const filename = path.basename(resolved.fsPath);

    return {
      statusCode: 200,
      headers: {
        ...cors,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
      isBase64Encoded: true,
      body: fileBuffer.toString("base64"),
    };
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Failed to serve template", message: err.message }) };
  }
};

