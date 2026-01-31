
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatWithRestaurantAI } from '../services/geminiService';
import { ViewState } from '../types';

// Stores
import { useAuthStore } from '../stores/useAuthStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useMenuStore } from '../stores/useMenuStore';
import { useFinanceStore } from '../stores/useFinanceStore';

// Services
import { translations } from '../services/translations';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  suggestion?: { label: string; view: ViewState };
}

const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { settings, branches } = useAuthStore();
  const { inventory } = useInventoryStore();
  const { orders } = useOrderStore();
  const { categories } = useMenuStore();
  const { accounts } = useFinanceStore();

  const menuItems = categories.flatMap(cat => cat.items);
  const lang = (settings.language || 'en') as 'en' | 'ar';
  const t = translations[lang] || translations['en'];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: lang === 'ar' ? 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟' : "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithRestaurantAI(
        input,
        {
          inventory,
          orders,
          menuItems,
          accounts,
          branches,
          settings
        }
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.text,
        timestamp: new Date(),
        suggestion: response.suggestion
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Communication Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: lang === 'ar' ? 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.' : "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestion = (view: ViewState) => {
    // In web app with router, ViewState strings might need to be mapped to paths
    const pathMap: Record<ViewState, string> = {
      'DASHBOARD': '/',
      'POS': '/pos',
      'INVENTORY': '/inventory',
      'REPORTS': '/reports',
      'SETTINGS': '/settings',
      'MENU': '/menu',
      'CRM': '/crm',
      'FINANCE': '/finance',
      'AI_INSIGHTS': '/ai-insights',
      'KDS': '/kds',
      'TABLES': '/floor-designer'
    } as any;

    const path = pathMap[view] || '/';
    navigate(path);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-24 lg:pb-0 lg:pt-0">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-4 ${message.sender === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${message.sender === 'ai' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'
                }`}>
                {message.sender === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>

              <div className={`max-w-[80%] flex flex-col gap-3 ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 md:p-6 rounded-[2rem] shadow-sm border ${message.sender === 'ai'
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                    : 'bg-indigo-600 border-indigo-500 text-white'
                  }`}>
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{message.text}</p>
                </div>

                {message.suggestion && (
                  <button
                    onClick={() => handleSuggestion(message.suggestion!.view)}
                    className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-200 transition-all border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2"
                  >
                    {lang === 'ar' ? 'انتقال إلى ' : 'Go to '} {message.suggestion.label}
                  </button>
                )}

                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot size={20} />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Assistant is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 md:p-8 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 sticky bottom-24 lg:bottom-0">
        <div className="max-w-4xl mx-auto relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={lang === 'ar' ? 'اكتب تساؤلك هنا... (مثال: ما هي الأصناف الأكثر ربحية؟)' : 'Type your query... (e.g., Which items are most profitable?)'}
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[2rem] py-5 px-8 pr-20 text-sm md:text-base font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-xl group-hover:shadow-2xl"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:shadow-none shadow-lg shadow-indigo-600/30"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
