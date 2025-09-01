const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    const { uploadedText } = JSON.parse(event.body);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI claims response assistant. Your role is to analyze uploaded insurer emails, denial letters, and other carrier or claim correspondences. 

          Your task is to:
          1. Extract and summarize key issues.
          2. Identify leverage points.
          3. Draft a polished, professional, persuasive, powerful response letter.
          4. Ensure the response is directly applicable to the uploaded document.
          5. Close with a strong professional call to action.

          ⚠️ Do not provide legal advice — only AI-assisted drafting. Every output must be final, polished, and ready to send.`
        },
        {
          role: "user",
          content: uploadedText
        }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ output: response.choices[0].message.content })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
