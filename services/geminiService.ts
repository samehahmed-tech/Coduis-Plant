
const DEFAULT_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = 'meta-llama/llama-3.1-8b-instruct';
const FALLBACK_MODEL = 'mistralai/mistral-7b-instruct';

/**
 * Isolated AI Service following OpenRouter Free Model Mandatory Guidelines
 */
async function callAI(prompt: string, systemInstruction?: string, apiKey?: string, useFallback = false) {
  // If the provided apiKey is a Gemini key (starts with AIza), ignore it and use the OpenRouter default
  const isGeminiKey = apiKey?.startsWith('AIza');
  const activeKey = (apiKey && !isGeminiKey) ? apiKey : DEFAULT_API_KEY;

  const currentModel = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;

  if (!activeKey || activeKey === 'PLACEHOLDER_API_KEY') {
    throw new Error("API_KEY_MISSING");
  }

  const messages = [
    {
      role: 'system',
      content: systemInstruction || "You are an assistant inside a restaurant ERP system. Provide helpful, non-financial advice and help users navigate the system."
    },
    { role: 'user', content: prompt }
  ];

  const body = {
    model: currentModel,
    messages: messages,
    temperature: 0.4,
    max_tokens: 300
  };

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`,
        'HTTP-Referer': 'https://restoflow-erp.com',
        'X-Title': 'Restaurant ERP System'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle Rate limits or model unavailability as per point 08
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      // Auto-fallback to alternative free model if primary fails (Point 02)
      if (!useFallback && (response.status === 404 || response.status === 503 || response.status === 400)) {
        console.warn(`Primary model ${PRIMARY_MODEL} failed, trying fallback...`);
        return callAI(prompt, systemInstruction, apiKey, true);
      }

      throw new Error(data.error?.message || `AI Service currently unavailable (${response.status})`);
    }

    return data.choices?.[0]?.message?.content || "";
  } catch (error: any) {
    if (!useFallback && error.message.includes("unavailable")) {
      return callAI(prompt, systemInstruction, apiKey, true);
    }
    console.error("AI Service Error:", error.message);
    throw error;
  }
}

/**
 * Analyzes menu engineering logically (Point 06: operational suggestions)
 */
export async function analyzeMenuEngineering(
  menuItems: any[],
  orderHistory: any[],
  lang: 'en' | 'ar' = 'en',
  apiKey?: string
): Promise<string> {
  try {
    const prompt = `
      Operational Suggestions for Menu:
      Menu Items: ${JSON.stringify(menuItems)}
      Order History: ${JSON.stringify(orderHistory)}
      
      Provide 3 simple suggestions in ${lang === 'ar' ? 'Arabic' : 'English'} on how to organize the menu or promote items based on these trends. 
      Do not make financial decisions. Keep it under 300 tokens.
    `;

    return await callAI(prompt, undefined, apiKey);
  } catch (error: any) {
    return lang === 'ar' ? `تنبيه: ${error.message}` : `AI Note: ${error.message}`;
  }
}

/**
 * Forecasts inventory needs (Point 06: Operational insights)
 */
export async function forecastInventory(
  inventory: any[],
  orderHistory: any[],
  lang: 'en' | 'ar' = 'en',
  apiKey?: string
): Promise<string> {
  try {
    const prompt = `
      Inventory Observation:
      Inventory: ${JSON.stringify(inventory)}
      Recent orders: ${JSON.stringify(orderHistory)}
      
      Identify items that might need restocking soon based on volume. 
      Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.
    `;

    return await callAI(prompt, undefined, apiKey);
  } catch (error: any) {
    return lang === 'ar' ? `تنبيه: ${error.message}` : `AI Note: ${error.message}`;
  }
}

/**
 * Intelligent Agent Utility (Supporting actions and structured responses)
 */
export async function chatWithRestaurantAI(
  message: string,
  context: {
    inventory: any[];
    orders: any[];
    menuItems: any[];
    accounts: any[];
    branches: any[];
    settings: any;
  },
  lang: 'en' | 'ar' = 'en',
  apiKey?: string
): Promise<{ text: string; actions?: any[]; suggestion?: any }> {
  try {
    const systemInstruction = `
      You are Zen AI, the expert agent for Coduis Zen Restaurant ERP.
      Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.
      
      You are an ACTIVE AGENT. You can interact with the system by returning a JSON object.
      RESPONSE FORMAT:
      {
        "text": "Your helpful response to the user",
        "actions": [
          { "type": "UPDATE_INVENTORY", "itemId": "id", "data": { "threshold": 10 } },
          { "type": "UPDATE_MENU_PRICE", "itemId": "id", "price": 150 },
          { "type": "CREATE_CUSTOMER", "data": { "name": "Name", "phone": "01..." } }
        ],
        "suggestion": { "label": "View Name", "view": "VIEW_CONSTANT" }
      }

      AVAILABLE ACTIONS:
      1. UPDATE_INVENTORY (itemId, data:Partial<InventoryItem>)
      2. UPDATE_MENU_PRICE (itemId, price:number)
      3. CREATE_CUSTOMER (data:Partial<Customer>)
      4. SHOW_REPORT (reportType: 'SALES'|'INVENTORY'|'FINANCE')

      CURRENT CONTEXT:
      - Inventory Items: ${context.inventory.length}
      - Recent Orders: ${context.orders.length}
      - Menu Items: ${context.menuItems.map(i => `${i.name} (ID:${i.id}, Price:${i.price})`).join(', ')}
      - Accounts: ${JSON.stringify(context.accounts.map(a => ({ name: a.name, balance: a.balance })))}
      
      If the user wants to change something, add the relevant object to "actions".
      Always return valid JSON. If no actions are needed, "actions" should be [].
    `;

    const rawResponse = await callAI(message, systemInstruction, apiKey);

    // Attempt to parse JSON
    try {
      const parsed = JSON.parse(rawResponse);
      return {
        text: parsed.text || "I processed your request.",
        actions: parsed.actions || [],
        suggestion: parsed.suggestion
      };
    } catch (e) {
      // Fallback if AI didn't return valid JSON
      return { text: rawResponse, actions: [] };
    }
  } catch (error: any) {
    console.error("Agent API Error:", error);
    return {
      text: lang === 'ar' ? `عذراً: ${error.message}` : `Error: ${error.message}`,
      actions: []
    };
  }
}

/**
 * Short operational insights (Point 06)
 */
export async function getBusinessInsights(
  salesData: any,
  inventoryData: any,
  lang: 'en' | 'ar' = 'en',
  apiKey?: string
): Promise<string> {
  try {
    const prompt = `
      Operational Snapshot:
      Activity: ${JSON.stringify(salesData)}
      Items needing attention: ${JSON.stringify(inventoryData)}
      Provide 2 brief operational tips in ${lang === 'ar' ? 'Arabic' : 'English'}.
    `;

    return await callAI(prompt, undefined, apiKey);
  } catch (error: any) {
    return lang === 'ar' ? "الخدمة غير متوفرة حالياً." : "AI Insights unavailable.";
  }
}
