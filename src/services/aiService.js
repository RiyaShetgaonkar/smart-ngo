import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Initialize with your existing key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// USE THIS STABLE MODEL
const MODEL_NAME = "gemini-2.5-flash-lite";

export async function matchVolunteers(emergency, volunteers) {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
    You are a disaster relief coordinator. 
    Emergency Details: ${JSON.stringify(emergency)}
    Available Volunteers: ${JSON.stringify(volunteers)}
    Task: Match the top 3 volunteers based on skill relevance and proximity.
    Return ONLY a valid JSON object with the following structure:
    {
      "matches": [
        { "name": "Name", "reasoning": "Reason", "score": 90 },
        { "name": "Name", "reasoning": "Reason", "score": 85 },
        { "name": "Name", "reasoning": "Reason", "score": 80 }
      ],
      "overallStrategy": "Short explanation of the matching logic used"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean potential markdown and parse
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Matching failed:", error);
    return null;
  }
}

export const forecastShortages = async (emergencyData) => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  const prompt = `
    Based on a ${emergencyData.severity} level disaster called "${emergencyData.title}" 
    with ${emergencyData.affectedCount || 100} people affected, 
    predict 3 critical supply shortages with specific quantities needed. 
    Be specific and urgent. Under 40 words.
    Example format: "500 medical kits, 200L clean water, 30 rescue workers needed immediately."
  `;

  try {
    const result = await model.generateContent(prompt);
    const prediction = result.response.text();

    await addDoc(collection(db, "ai_alerts"), {
      emergencyId: emergencyData.id,
      emergencyTitle: emergencyData.title,
      prediction: prediction,
      severity: emergencyData.severity,
      timestamp: serverTimestamp()
    });

    return prediction;
  } catch (error) {
    console.error("SHE: Forecasting failed", error);
    return "Supply prediction currently unavailable.";
  }
};