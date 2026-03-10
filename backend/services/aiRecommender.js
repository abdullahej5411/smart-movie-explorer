import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the working key from your .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getRecommendations = async (mood) => {
  // Use the 2026 stable model: gemini-2.5-flash
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json", // Force native JSON output
      temperature: 0.7,
    }
  });

  const prompt = `
    Suggest exactly 5 highly rated movies for someone feeling "${mood}".
    Return a JSON array of objects with exactly two keys: "title" and "reason".
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini 2026 Error:", error.message);
    
    // Updated fallback for 2026
    return [
      { title: "Everything Everywhere All At Once", reason: "Perfect for any mood" },
      { title: "Spider-Man: Across the Spider-Verse", reason: "Visually stunning and exciting" }
    ];
  }
};