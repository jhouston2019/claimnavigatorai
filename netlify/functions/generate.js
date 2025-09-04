const OpenAI = require("openai");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized - Please login" }) };
  }

  try {
    const { uploadedText, files, language } = JSON.parse(event.body || "{}");

    // 1) Extract text from provided inputs
    const extractedTexts = [];
    if (uploadedText && typeof uploadedText === "string") {
      extractedTexts.push(uploadedText);
    }

    if (Array.isArray(files)) {
      for (const file of files) {
        try {
          const base64 = file && file.data;
          const mime = (file && file.type) || "";
          if (!base64) continue;
          const buffer = Buffer.from(base64, "base64");

          if (mime === "application/pdf" || (file.name || "").toLowerCase().endsWith(".pdf")) {
            const parsed = await pdfParse(buffer);
            if (parsed && parsed.text) {
              extractedTexts.push(parsed.text);
            }
          } else if (mime.startsWith("image/") || /(jpg|jpeg|png|bmp|gif|tif|tiff)$/i.test(file.name || "")) {
            const langCode = language === "es" ? "spa" : "eng";
            const result = await Tesseract.recognize(buffer, langCode);
            if (result && result.data && result.data.text) {
              extractedTexts.push(result.data.text);
            }
          }
        } catch (parseErr) {
          // Continue with other files if one fails
          console.error("File parse error:", parseErr.message);
        }
      }
    }

    const combinedInput = extractedTexts.join("\n\n").slice(0, 20000); // guard size
    if (!combinedInput) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No valid input provided" }) };
    }

    // 2) Check available credits
    const email = user.email;
    const userStore = getStore("users");
    const purchaseStore = getStore("purchases");
    const responsesStore = getStore("responses");

    const userData = await userStore.getJSON(email);
    if (!userData || !Array.isArray(userData.purchases) || userData.purchases.length === 0) {
      return { statusCode: 402, headers, body: JSON.stringify({ error: "No credits available. Please purchase credits." }) };
    }

    let totalCredits = 0;
    let creditsUsed = 0;
    const purchaseRecords = [];
    for (const sessionId of userData.purchases) {
      const rec = await purchaseStore.getJSON(sessionId);
      if (rec) {
        purchaseRecords.push(rec);
        totalCredits += rec.aiCredits || 0;
        creditsUsed += rec.creditsUsed || 0;
      }
    }

    const available = totalCredits - creditsUsed;
    if (available <= 0) {
      return { statusCode: 402, headers, body: JSON.stringify({ error: "No credits remaining. Please purchase more credits." }) };
    }

    // 3) Generate AI response
    const systemPrompt = `You are an AI claims response assistant. Analyze uploaded insurer letters and claim correspondence.

Your task:
1) Extract and summarize key issues.
2) Identify leverage points.
3) Draft a polished, professional, persuasive response letter.
4) Ensure the response is directly applicable to the content provided.
5) Close with a strong professional call to action.

Do not provide legal advice — only AI-assisted drafting. Output must be final and ready to send.`;

    const ai = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: combinedInput }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    const output = ai.choices?.[0]?.message?.content || "";
    if (!output) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "AI generation failed" }) };
    }

    // 4) Deduct a credit from the earliest purchase with remaining credits
    for (const rec of purchaseRecords) {
      const recCredits = (rec.aiCredits || 0) - (rec.creditsUsed || 0);
      if (recCredits > 0) {
        rec.creditsUsed = (rec.creditsUsed || 0) + 1;
        rec.lastUsed = new Date().toISOString();
        await purchaseStore.setJSON(rec.sessionId, rec);
        break;
      }
    }

    // 5) Store response
    const key = `${email}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.json`;
    await responsesStore.setJSON(key, {
      email,
      createdAt: new Date().toISOString(),
      inputPreview: combinedInput.slice(0, 2000),
      output,
      files: Array.isArray(files) ? files.map(f => ({ name: f.name, type: f.type, size: (f.data ? Buffer.byteLength(f.data, 'base64') : 0) })) : [],
      model: "gpt-4o-mini"
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ output })
    };
  } catch (error) {
    console.error("generate error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
