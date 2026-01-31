
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { chatWithRestaurantAI } from '../services/geminiService';
import { AppSettings, InventoryItem, Order, MenuItem, FinancialAccount, Branch, ViewState } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  suggestion?: { label: string; view: ViewState };
}

interface AIAssistantProps {
  settings: AppSettings;
  inventory: InventoryItem[];
  orders: Order[];
  menuItems: MenuItem[];
  accounts: FinancialAccount[];
  branches: Branch[];
  lang: 'en' | 'ar';
  t: any;
  onChangeView: (view: ViewState) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ settings, inventory, orders, menuItems, accounts, branches, lang, t, onChangeView }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: lang === 'ar' ? 'أهلاً بك في مركز قيادة Coduis Zen! أنا Zen AI، محرك البيانات الذكي الخاص بك. كيف يمكنني خدمتك اليوم؟' : 'Welcome to Coduis Zen Command Center! I am Zen AI, your intelligent data orchestrator. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseAction = (text: string): { cleanText: string; suggestion?: { label: string; view: ViewState } } => {
    // Example format: [COMMAND:NAVIGATE:POS|Go to Point of Sale]
    const navRegex = /\[COMMAND:NAVIGATE:(\w+)\|([^\]]+)\]/;
    const match = text.match(navRegex);
    if (match) {
      return {
        cleanText: text.replace(navRegex, '').trim(),
        suggestion: { view: match[1] as ViewState, label: match[2] }
      };
    }
    return { cleanText: text };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const context = `
      --- RESTAURANT OPERATIONAL SNAPSHOT ---
      Name: ${settings.restaurantName}
      Branches: ${branches.map(b => b.name).join(', ')}
      Accounts: ${JSON.stringify(accounts.map(a => ({ name: a.name, balance: a.balance })))}
      Inventory Status: ${JSON.stringify(inventory.slice(0, 10).map(i => ({ name: i.name, stock: i.warehouseQuantities.reduce((a, b) => a + b.quantity, 0) })))}
      Latest Activity: ${orders.length} orders today. Total Revenue roughly ${orders.reduce((sum, o) => sum + o.total, 0)} ${settings.currency}.
      Available Screens: DASHBOARD, POS, KDS, INVENTORY, FINANCE, CRM, REPORTS, MENU_MANAGER, RECIPES, SETTINGS.
      
      GUIDELINE: If the user wants to go somewhere or do something available in the list above, end your response with: [COMMAND:NAVIGATE:SCREEN_NAME|Button Label].
      Example: If they ask to sell items, suggest [COMMAND:NAVIGATE:POS|Open POS Screen].
    `;

    const responseText = await chatWithRestaurantAI(userMessage.text, context, lang, settings.geminiApiKey);
    const { cleanText, suggestion } = parseAction(responseText);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: cleanText,
      timestamp: new Date(),
      suggestion
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <div className="p-8 h-screen flex flex-col transition-colors">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <Bot className="text-indigo-600 animate-bounce" size={40} />
            {t.ai}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">{lang === 'ar' ? 'مساعدك الذكي لإدارة العمليات والبيانات.' : 'Your neural link to restaurant operations and data.'}</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200">System Synced</div>
          <div className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-200">OpenRouter Active</div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-w-5xl mx-auto w-full transition-all border-b-[12px] border-indigo-600/20">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-6 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'ai' ? 'bg-indigo-600 text-white rotate-3' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 -rotate-3'
                }`}>
                {msg.sender === 'ai' ? <Bot size={28} /> : <User size={28} />}
              </div>

              <div className="flex flex-col gap-3 min-w-[200px] max-w-[75%]">
                <div className={`p-6 rounded-[2rem] shadow-xl ${msg.sender === 'ai'
                  ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'
                  : 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200/50'
                  }`}>
                  <p className={`whitespace-pre-wrap leading-relaxed font-bold text-sm ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{msg.text}</p>
                  <span className={`text-[9px] mt-4 block font-black uppercase tracking-[0.2em] opacity-40 ${msg.sender === 'ai' ? 'text-left' : 'text-right'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.suggestion && (
                  <button
                    onClick={() => onChangeView(msg.suggestion!.view)}
                    className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95 self-start animate-in zoom-in duration-300"
                  >
                    <Send size={16} />
                    {msg.suggestion.label}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-4 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'ar' ? 'اسأل عن المبيعات، المخزون، أو اطلب المساعدة في التنقل...' : "Ask about sales, stock, or ask for navigation help..."}
              className={`flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] px-8 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800 dark:text-white shadow-inner transition-all ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-8 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center group"
            >
              {isLoading ? <Loader2 className="animate-spin" size={28} /> : <Send size={28} className={`transition-transform group-hover:translate-x-1 ${lang === 'ar' ? 'rotate-180' : ''}`} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
