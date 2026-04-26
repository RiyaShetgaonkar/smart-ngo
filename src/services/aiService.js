// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// export async function matchVolunteers(emergency, volunteers) {
// //   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// // Try this specific model string instead
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
//   const prompt = `
//     You are a disaster relief coordinator. 
//     Emergency: ${JSON.stringify(emergency)}
//     Available Volunteers: ${JSON.stringify(volunteers)}
    
//     Task: Match the top 3 volunteers based on:
//     1. Skill match (e.g., medical, rescue).
//     2. Proximity.
    
//     Return ONLY a valid JSON object with the following structure:
//     {
//       "matches": [
//         { "name": string, "reasoning": string, "score": number },
//         ...
//       ],
//       "overallStrategy": string
//     }
//   `;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
//     // Clean up potential markdown formatting in response
//     const jsonString = text.replace(/```json/g, "").replace(/```/g, "");
//     return JSON.parse(jsonString);
//   } catch (error) {
//     console.error("AI Matching failed:", error);
//     return null;
//   }
// }
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function matchVolunteers(emergency, volunteers) {
  // Update to the model name shown in your AI Studio dashboard
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

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
    
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Matching failed:", error);
    return null;
  }
}