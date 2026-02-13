// netlify/functions/chat.js
exports.handler = async function(event, context) {
  // 1. Debug Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  // 2. Handle POST check
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const prompt = body.prompt || "Hello";
    
    // 3. CHECK API KEY
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.log("CRITICAL: API Key is missing");
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ error: "Configuration Error: API Key is missing in Netlify." }) 
      };
    }

    // 4. CALL GOOGLE (With explicit error catching)
    console.log("Calling Gemini 1.5 Flash...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    // 5. Check if Google returned an error
    if (data.error) {
       console.log("Google Error:", data.error);
       return { 
         statusCode: 500, 
         headers,
         body: JSON.stringify({ error: `Google API Error: ${data.error.message}` }) 
       };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.log("Crash Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Server Crash: ${error.message}` }),
    };
  }
};