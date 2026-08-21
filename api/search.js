module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query =
    (req.query && (req.query.name || req.query.query || req.query.q)) ||
    (req.body && (req.body.name || req.body.query || req.body.q));

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: "Missing or invalid name query parameter." });
  }

  const cleanQuery = query.trim();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not configured.");
    return res.status(500).json({
      error: "Search Service Error: GEMINI_API_KEY environment variable is not configured on the server."
    });
  }

  const prompt = `You are a name authority database assistant. Analyze the name "${cleanQuery}".
Return a JSON object with the following schema:
{
  "isRealName": true,
  "name": "${cleanQuery}",
  "gender": "male" | "female" | "unisex",
  "meaning": "concise description of meaning",
  "origin": "primary origin/culture",
  "language": "primary language",
  "pronunciation": "phonetic guide e.g. ee-LOR-ah",
  "alternativeSpellings": ["variation1", "variation2"]
}

Set "isRealName" to false if "${cleanQuery}" is not a real name, gibberish, or invalid name.
Return ONLY valid JSON matching this schema.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Gemini API HTTP Error status: ${response.status}`);
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        return res.status(500).json({
          error: "Search service authentication error or invalid API key configuration."
        });
      } else if (response.status === 429) {
        return res.status(429).json({
          error: "Search service rate limit exceeded. Please try again later."
        });
      } else {
        return res.status(500).json({
          error: "Search service is currently unavailable. Please try again later."
        });
      }
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("Empty content structure from Gemini API");
      return res.status(500).json({ error: "Received empty response from search service." });
    }

    let parsedResult;
    try {
      const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response JSON:", parseError);
      return res.status(500).json({ error: "Failed to parse name search response." });
    }

    if (!parsedResult || typeof parsedResult !== 'object' || parsedResult.isRealName === false) {
      return res.status(404).json({ notFound: true, message: `Name "${cleanQuery}" not found.` });
    }

    const resultObject = {
      id: `ai-${cleanQuery.toLowerCase().replace(/\s+/g, '-')}`,
      name: parsedResult.name || cleanQuery,
      gender: (parsedResult.gender || 'unisex').toLowerCase(),
      meaning: parsedResult.meaning || 'Meaning details unavailable.',
      origin: parsedResult.origin || 'Unknown',
      language: parsedResult.language || 'Unknown',
      pronunciation: parsedResult.pronunciation || 'N/A',
      alternativeSpellings: Array.isArray(parsedResult.alternativeSpellings) ? parsedResult.alternativeSpellings : [],
      isAiGenerated: true
    };

    return res.status(200).json(resultObject);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error("Gemini API request timed out after 10s");
      return res.status(504).json({ error: "Search request timed out. Please try again." });
    }

    console.error("Unhandled error in search function:", error.message || error);
    return res.status(500).json({ error: "Internal server error while processing request." });
  }
};
