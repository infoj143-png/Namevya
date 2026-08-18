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
    console.error("GEMINI_API_KEY is not configured in environment variables.");
    return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured on the server." });
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

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    if (!response.ok) {
      console.error(`Gemini API HTTP Error status: ${response.status}`);
      return res.status(500).json({
        error: `Gemini API returned status ${response.status}`
      });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("Empty content structure from Gemini API");
      return res.status(500).json({ error: "Received empty response from Gemini API." });
    }

    let parsedResult;
    try {
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response JSON:", parseError);
      return res.status(500).json({ error: "Failed to parse AI response." });
    }

    if (!parsedResult || parsedResult.isRealName === false) {
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
    console.error("Unhandled error in search function:", error);
    return res.status(500).json({ error: "Internal server error while processing request." });
  }
};
