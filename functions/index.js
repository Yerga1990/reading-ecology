import * as functions from "firebase-functions";
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Use export for the Cloud Function and follow import guidelines
export const geminiApi = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const { action, word, context, passageContent } = req.body;
    // Fix: Always use { apiKey: process.env.API_KEY } for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (action === "translate") {
      // Enforce JSON structure using responseSchema
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the word "${word}" into Russian for this context: "${context}".`,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translation: { type: Type.STRING },
              definition: { type: Type.STRING }
            },
            required: ["translation", "definition"]
          }
        }
      });
      // Fix: Access the .text property directly (not a method)
      res.status(200).send(response.text);
      return;
    }

    if (action === "quiz") {
      // Enforce array of objects structure using responseSchema
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
      // Fix: Access the .text property directly (not a method)
      res.status(200).send(response.text);
      return;
    }

    res.status(400).send("Invalid Action");
  } catch (error) {
    console.error("Firebase Function Error:", error);
    res.status(500).json({ error: error.message });
  }
});