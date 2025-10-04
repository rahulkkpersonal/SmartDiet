
import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, DietPlan, MealAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateDietPlan = async (profile: UserProfile): Promise<DietPlan> => {
  try {
    const prompt = `Based on the following user profile, generate a personalized diet plan. The user's name is ${profile.name}, age ${profile.age}, height ${profile.height} cm, weight ${profile.weight} kg, with a BMI of ${profile.bmi} which is categorized as '${profile.bmiCategory}'. Create a balanced diet plan with a daily calorie goal, macro breakdown in grams (protein, carbs, fat), and concise, healthy meal suggestions for breakfast, lunch, dinner, and snacks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyCalorieGoal: { type: Type.NUMBER },
            macroBreakdown: {
              type: Type.OBJECT,
              properties: {
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
              },
              required: ["protein", "carbs", "fat"],
            },
            mealSuggestions: {
              type: Type.OBJECT,
              properties: {
                breakfast: { type: Type.STRING },
                lunch: { type: Type.STRING },
                dinner: { type: Type.STRING },
                snacks: { type: Type.STRING },
              },
              required: ["breakfast", "lunch", "dinner", "snacks"],
            },
          },
          required: ["dailyCalorieGoal", "macroBreakdown", "mealSuggestions"],
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as DietPlan;
  } catch (error) {
    console.error("Error generating diet plan:", error);
    throw new Error("Failed to generate diet plan. Please try again.");
  }
};

export const analyzeMealImage = async (base64Image: string, mimeType: string): Promise<MealAnalysis> => {
  try {
    const prompt = "Analyze the contents of this meal image. Estimate the total calories for the entire meal. For each distinct food item, provide its name, estimated calories, whether it's an item to avoid for a healthy diet (e.g., high in processed sugar or saturated fat), and suggest a healthier alternative if it is avoidable.";

    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType: mimeType,
      },
    };

    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalCalories: { type: Type.NUMBER, description: "Total estimated calories for the entire meal." },
            items: {
              type: Type.ARRAY,
              description: "List of food items identified in the meal.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the food item." },
                  calories: { type: Type.NUMBER, description: "Estimated calories for this item." },
                  avoidable: { type: Type.BOOLEAN, description: "True if this item is generally unhealthy and should be avoided." },
                  alternative: { type: Type.STRING, description: "A healthier alternative suggestion if the item is avoidable." },
                },
                required: ["name", "calories", "avoidable"],
              },
            },
          },
          required: ["totalCalories", "items"],
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as MealAnalysis;
  } catch (error) {
    console.error("Error analyzing meal image:", error);
    throw new Error("Failed to analyze meal. Please try a clearer image.");
  }
};
