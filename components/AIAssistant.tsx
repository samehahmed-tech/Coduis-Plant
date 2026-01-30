
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { chatWithRestaurantAI } from '../services/geminiService';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface AIAssistantProps {
  lang: 'en' | 'ar';
  t: any;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ lang, t }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: lang === 'ar' ? 'أهلاً بك! أنا مساعد RestoFlow الذكي. كيف يمكنني مساعدتك في إدارة المطعم اليوم؟' : 'Hello! I am your RestoFlow Assistant. How can I help you manage the restaurant today?',
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

    const context = "It is lunch rush. Kitchen is at 80% capacity. Inventory for steaks is low. Revenue is up 10% today.";
    
    const responseText = await chatWithRestaurantAI(userMessage.text, context, lang);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <div className="p-8 h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{t.ai}</h2>
        <p className="text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'اسأل عن العمليات، أفكار تسويقية، أو وصفات.' : 'Ask about operations, marketing ideas, or recipes.'}</p>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-w-4xl mx-auto w-full transition-colors">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.sender === 'ai' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {msg.sender === 'ai' ? <Bot size={24} /> : <User size={24} />}
              </div>
              
              <div className={`max-w-[80%] p-5 rounded-[1.5rem] shadow-sm ${
                msg.sender === 'ai' 
                  ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none' 
                  : 'bg-indigo-600 text-white rounded-tr-none'
              }`}>
                <p className={`whitespace-pre-wrap leading-relaxed font-medium ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{msg.text}</p>
                <span className={`text-[10px] mt-3 block font-bold uppercase tracking-widest opacity-60 ${msg.sender === 'ai' ? 'text-left' : 'text-right'}`}>
                   {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800">
           <div className="flex gap-2">
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder={lang === 'ar' ? 'اكتب رسالتك هنا...' : "Type your message here..."}
               className={`flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`}
               disabled={isLoading}
             />
             <button 
               onClick={handleSend}
               disabled={isLoading || !input.trim()}
               className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
             >
               {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} className={lang === 'ar' ? 'rotate-180' : ''} />}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
