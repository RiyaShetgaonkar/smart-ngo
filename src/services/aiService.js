import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * R & F Part: Match Volunteers with AI
 * Matches top 3 volunteers based on skill relevance and proximity.
 */
export async function matchVolunteers(emergency, volunteers) {
  // Using gemini-1.5-flash for faster response during demo
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    
    // Clean potential markdown and parse JSON
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Matching failed:", error);
    return null;
  }
}

/**
 * SHE Part: Predictive Forecasting
 * Predicts supply shortages and pushes an alert to Firestore.
 */
export const forecastShortages = async (emergencyData) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
    Based on a ${emergencyData.severity} level disaster with ${emergencyData.affectedCount} people affected, 
    predict exactly 3 critical supply shortages that will occur in the next 24 hours. 
    Be specific (e.g., "Need 500 liters of water"). 
    Keep it under 30 words.
  `;

  try {
    const result = await model.generateContent(prompt);
    const prediction = result.response.text();

    // SHE: Push forecast alerts to Firestore [Requirement Checklist 0/3]
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
