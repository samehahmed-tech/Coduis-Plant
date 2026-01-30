
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * Helper to call Gemini API using direct Fetch
 */
async function callGeminiAPI(prompt: string, systemInstruction?: string) {
  if (!API_KEY || API_KEY === 'PLACEHOLDER_API_KEY') {
    throw new Error("API_KEY_MISSING");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    system_instruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Gemini API Error");
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function analyzeMenuEngineering(
  menuItems: any[],
  orderHistory: any[],
  lang: 'en' | 'ar' = 'en'
): Promise<string> {
  try {
    const prompt = `
      You are a Restaurant Business Analyst. Perform a "Menu Engineering" analysis (Stars, Plowhorses, Puzzles, Dogs) on this data:
      Menu Items: ${JSON.stringify(menuItems)}
      Order History (Subset): ${JSON.stringify(orderHistory)}
      
      Provide a structured response in ${lang === 'ar' ? 'Arabic' : 'English'} with:
      1. Identification of "Star" items (High profit, High popularity).
      2. Identification of "Dog" items (Low profit, Low popularity).
      3. Specific advice on what to remove or promote.
      Keep it professional and concise.
    `;

    return await callGeminiAPI(prompt);
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") return lang === 'ar' ? "يرجى إعداد مفتاح API الخاص بـ Gemini." : "Please set your Gemini API Key.";
    return "Error analyzing menu.";
  }
}

export async function forecastInventory(
  inventory: any[],
  orderHistory: any[],
  lang: 'en' | 'ar' = 'en'
): Promise<string> {
  try {
    const prompt = `
      You are a Supply Chain Analyst for a restaurant. Based on this inventory and past sales:
      Inventory: ${JSON.stringify(inventory)}
      Past Sales: ${JSON.stringify(orderHistory)}
      
      Predict which items will run out soon and estimate when.
      Provide 3 specific warnings in ${lang === 'ar' ? 'Arabic' : 'English'}.
    `;

    return await callGeminiAPI(prompt);
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") return lang === 'ar' ? "يرجى إعداد مفتاح API الخاص بـ Gemini." : "Please set your Gemini API Key.";
    return "Error forecasting inventory.";
  }
}

export async function chatWithRestaurantAI(
  message: string,
  contextData: string,
  lang: 'en' | 'ar' = 'en'
): Promise<string> {
  try {
    const systemInstruction = `
      You are an expert Restaurant ERP Assistant named RestoFlow AI.
      Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.
      Context: ${contextData}
    `;

    return await callGeminiAPI(message, systemInstruction);
  } catch (error: any) {
    console.error("Chat API Error:", error);
    if (error.message === "API_KEY_MISSING") return lang === 'ar' ? "يرجى إعداد مفتاح API الخاص بـ Gemini." : "Please configure Gemini API Key.";
    return lang === 'ar' ? "عذراً، أواجه مشكلة في الاتصال حالياً." : "Sorry, I am having trouble connecting right now.";
  }
}

export async function getBusinessInsights(
  salesData: any,
  inventoryData: any,
  lang: 'en' | 'ar' = 'en'
): Promise<string> {
  try {
    const prompt = `
      Analyze this restaurant data and provide 3 actionable bullet points in ${lang === 'ar' ? 'Arabic' : 'English'}:
      Sales: ${JSON.stringify(salesData)}
      Low Stock: ${JSON.stringify(inventoryData)}
    `;

    return await callGeminiAPI(prompt);
  } catch (error: any) {
    return lang === 'ar' ? "حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي." : "An error occurred while connecting to the AI service.";
  }
}
