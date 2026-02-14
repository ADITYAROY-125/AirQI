// netlify/functions/chat.js
exports.handler = async function(event, context) {
  // 1. Check Request Method
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 2. Parse Body
    let prompt;
    try {
      const body = JSON.parse(event.body);
      prompt = body.prompt;
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
    }

    // 3. Check API Key
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error("CRITICAL: GEMINI_API_KEY is missing from Netlify Environment Variables");
      return { statusCode: 500, body: JSON.stringify({ error: "Server Configuration Error: API Key missing" }) };
    }

    // 4. Call Google Gemini 2.0 Flash (Your Stable Model)
    // ✅ CORRECTED: Using 'gemini-2.0-flash' which is in your approved list
    console.log("Sending request to Google Gemini 2.0 Flash...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    // 5. Check if Google rejected the key or request
    if (!response.ok) {
      console.error("Google API Error:", data);
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ error: `Google Error: ${data.error?.message || "Unknown API Error"}` }) 
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