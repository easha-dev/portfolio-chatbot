import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let conversationHistory = [];

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const question = req.body.question;

  conversationHistory.push({
    role: "user",
    content: question
  });

  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }

  const portfolioData = fs.readFileSync("portfolio_data.txt","utf8");

  try {

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are Easha speaking directly to visitors on your UX portfolio.

Be concise and conversational.

Return JSON:

{
 "message": "answer",
 "suggestions": ["prompt1","prompt2","prompt3"]
}

Portfolio data:
${portfolioData}
`
        },
        ...conversationHistory
      ]
    });

    const ai = JSON.parse(response.choices[0].message.content);

    res.status(200).json(ai);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Something went wrong.",
      suggestions: [
        "Tell me about Proact",
        "Show another project",
        "Explain your design process"
      ]
    });

  }
}
