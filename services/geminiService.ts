
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SalesData } from "../types";

export const getBusinessInsights = async (
  salesData: SalesData[],
  receivables: number,
  payables: number,
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    return "Please configure your API Key in Profile settings to use the Smart Assistant.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Act as a smart business consultant for a small Indian business owner using the "Dhandha" app.
      Analyze the following data:
      - Weekly Sales Trend: ${JSON.stringify(salesData)}
      - Total Market Receivables (Udhaar to collect): ₹${receivables}
      - Total Payables (Vendor dues): ₹${payables}

      Provide a concise 3-sentence summary in plain English (or Hinglish if appropriate context implies):
      1. One observation about sales performance.
      2. One actionable tip about cash flow or inventory.
      3. An encouraging closing remark.
      Keep it friendly and professional.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to connect to Smart Assistant. Verification failed or internet issue.";
  }
};
