// netlify/functions/chat.js
exports.handler = async function(event, context) {
  // 1. Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 2. Parse the User's Input
    let prompt;
    try {
      const body = JSON.parse(event.body);
      prompt = body.prompt;
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
    }

    // 3. Get API Key
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Server Error: API Key missing" }) };
    }

    // ✅ 4. THE FIX: Using 'v1' Endpoint & Structured Payload
    console.log("Sending request to Gemini 2.5 Flash (v1)...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    // 5. Handle Errors (Quota, Model Not Found, etc.)
    if (!response.ok) {
      console.error("Google API Error:", data);
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ error: data.error || data }) 
      };
    }

    // 6. Success
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error("Server Crash:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Backend Crash: ${error.message}` }),
    };
  }
};