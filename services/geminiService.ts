import { GoogleGenAI } from "@google/genai";
import { SalesData } from "../types";

const apiKey = process.env.API_KEY || '';

// Safely initialize GenAI only when needed to handle potential missing keys gracefully in UI
const getAiClient = () => {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getBusinessInsights = async (
  salesData: SalesData[],
  receivables: number,
  payables: number
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Please configure your API Key to use the Smart Assistant.";

  const prompt = `
    Act as a smart business consultant for a small Indian Kirana store owner.
    Analyze the following data:
    - Weekly Sales Trend: ${JSON.stringify(salesData)}
    - Total Market Receivables (Udhaar to collect): ₹${receivables}
    - Total Payables (Vendor dues): ₹${payables}

    Provide a concise, 3-sentence summary.
    1. One observation about sales.
    2. One actionable tip about cash flow or inventory.
    3. An encouraging closing remark.
    Keep the tone friendly, professional, and easy to understand.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate insights at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to the smart assistant. Please check your internet connection.";
  }
};
