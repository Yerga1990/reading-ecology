
import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { action, word, context, passageContent } = JSON.parse(event.body);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (action === "translate") {
      // Use responseSchema to ensure the model returns structured JSON correctly
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the word "${word}" into Russian for this context: "${context}".`,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translation: { 
                type: Type.STRING,
                description: 'The Russian translation of the word.'
              },
              definition: { 
                type: Type.STRING,
                description: 'A brief English definition and usage note.'
              }
            },
            required: ["translation", "definition"]
          }
        }
      });
      return {
        statusCode: 200,
        body: response.text,
      };
    }

    if (action === "quiz") {
      // Use responseSchema to enforce the structure of the generated quiz items
      const prompt = `IELTS Expert Tutor: Create a 15-question academic vocabulary quiz from this text: "${passageContent}". 
      Select 15 distinct, high-level academic words. For each, create a multiple-choice question about its contextual meaning.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["word", "question", "options", "correctAnswerIndex", "explanation"]
            }
          }
        }
      });
      return {
        statusCode: 200,
        body: response.text,
      };
    }

    return { statusCode: 400, body: "Invalid Action" };
  } catch (error: any) {
    console.error("Backend Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
