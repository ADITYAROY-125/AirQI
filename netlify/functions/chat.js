// netlify/functions/chat.js
exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 1. Get the single prompt string from the frontend
    const { prompt } = JSON.parse(event.body);

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Server Error: API Key missing" }) };
    }

    // 2. Call Google Gemini
    // I used 'gemini-1.5-flash' here. If you really have access to 2.5, change it here!
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }] // We send the whole context as one user message
            }
          ]
        })
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error("Backend Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to connect to AI" }),
    };
  }
};