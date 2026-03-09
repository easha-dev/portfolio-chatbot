require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const portfolioData = fs.readFileSync(process.cwd() + "/portfolio_data.txt", "utf8");

// conversation memory
let conversationHistory = [];

// API endpoint
app.post("/ask", async (req, res) => {

  const question = req.body.question;

  // log questions
  fs.appendFileSync("questions_log.txt", question + "\n");

  // store user message
  conversationHistory.push({
    role: "user",
    content: question
  });

  // limit conversation memory
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }

  try {

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
    
      response_format: { type: "json_object" },
    
      messages: [
        {
          role: "system",
          content: `
You are Easha speaking directly to visitors on your UX portfolio.

Speak in FIRST PERSON.

Tone:
- warm
- confident
- conversational
- concise

Answer style:
- 3–6 sentences maximum
- break ideas into short paragraphs
- use bullet points when useful
- highlight key ideas with **bold**

Do not invent project details.

If something isn't in the portfolio say:
"I haven't added that detail to my portfolio yet."

After each answer, suggest 3 short follow-up prompts.

Prompt rules:
- maximum 5 words
- portfolio specific
- encourage exploring projects

Respond ONLY with valid JSON.

Format:

{
 "message": "formatted answer",
 "suggestions": [
   "prompt one",
   "prompt two",
   "prompt three"
 ]
}

PORTFOLIO DATA:
${portfolioData}
`
        },

        ...conversationHistory
      ],
    });

    const aiRaw = response.choices[0].message.content;

    let answer = "";
    let suggestions = [];

    try {

      // remove ```json wrappers if the model adds them
      const aiData = JSON.parse(aiRaw);

      answer = aiData.message;
      suggestions = aiData.suggestions;

    } catch (err) {

      console.log("JSON parse failed. Raw response:", aiRaw);

      answer = "Sorry — something went wrong generating that response.";

      suggestions = [
        "Tell me about Proact",
        "Show another project",
        "Explain your design process"
      ];

    }

    // ensure suggestions always exist
    if (!suggestions || suggestions.length === 0) {
      suggestions = [
        "Tell me about Proact",
        "Show another project",
        "Explain your design process"
      ];
    }

    // attach project links automatically
    const lowerAnswer = answer.toLowerCase();

    if (!lowerAnswer.includes("http")) {

      if (lowerAnswer.includes("proact")) {
        answer += `<br><br><a href="https://www.eashagc.com/project-new/proact" target="_blank">View the full Proact case study →</a>`;
      }

      if (lowerAnswer.includes("gamification")) {
        answer += `<br><br><a href="https://www.eashagc.com/project-new/gamification" target="_blank">View the Gamification case study →</a>`;
      }

      if (lowerAnswer.includes("humana")) {
        answer += `<br><br><a href="https://www.eashagc.com/project-new/humana" target="_blank">View the Humana case study →</a>`;
      }

      if (lowerAnswer.includes("ivas")) {
        answer += `<br><br><a href="https://www.eashagc.com/project-new/ivas" target="_blank">View the IVAS case study →</a>`;
      }

    }

    // store assistant reply
    conversationHistory.push({
      role: "assistant",
      content: answer
    });

    res.json({
      answer: answer,
      suggestions: suggestions
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      answer: "Something went wrong. Please try again.",
      suggestions: [
        "Tell me about Proact",
        "Show another project",
        "Explain your design process"
      ]
    });

  }

});

module.exports = app;
