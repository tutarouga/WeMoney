import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, X, Send, Bot, User, Sparkles, Lock } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { formatCurrency } from '../lib/utils';
import { subDays, startOfDay } from 'date-fns';

// Initialize Gemini API
// Use VITE_GEMINI_API_KEY for Netlify deployment, fallback to process.env for AI Studio preview
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatbot() {
  const { profile, categories } = useAppContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Sou seu Conselheiro Financeiro IA. Como posso ajudar com suas finanças hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isPaidPlan = profile?.plan_type === 'pro' || profile?.plan_type === 'lifetime';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleOpen = () => {
    if (!isPaidPlan) {
      setShowPaywall(true);
      return;
    }
    setIsOpen(true);
  };

  const fetchFinancialContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';

      const thirtyDaysAgo = startOfDay(subDays(new Date(), 30)).toISOString();

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo)
        .is('event_id', null);

      if (error) throw error;

      let totalIncome = 0;
      const expensesByCategory: Record<string, number> = {};

      transactions?.forEach(t => {
        if (t.type === 'income') {
          totalIncome += Number(t.amount);
        } else {
          const cat = categories.find(c => c.id === t.category)?.label || t.category;
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(t.amount);
        }
      });

      const expensesString = Object.entries(expensesByCategory)
        .map(([cat, amount]) => `${cat}: ${formatCurrency(amount)}`)
        .join(', ');

      return `Dados atuais (últimos 30 dias): Renda Total: ${formatCurrency(totalIncome)}, Gastos: ${expensesString || 'Nenhum gasto registrado'}.`;
    } catch (error) {
      console.error('Error fetching context:', error);
      return 'Dados atuais: Não foi possível carregar os dados recentes.';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const financialContext = await fetchFinancialContext();
      
      const prompt = `Você é um consultor financeiro amigável do aplicativo Nossas Finanças. Analise os seguintes gastos recentes do usuário: [${financialContext}]. Agora, responda de forma curta e direta à pergunta do usuário: [${userMessage}]. Dê dicas práticas para o dia a dia, como economizar nas compras de supermercado ou planejar os gastos com os filhos.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const assistantMessage = response.text || 'Desculpe, não consegui processar sua solicitação no momento.';
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Desculpe, ocorreu um erro ao conectar com o servidor da IA. Tente novamente mais tarde.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40 group"
      >
        <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
              Conselheiro Financeiro IA
            </h3>
            <p className="text-center text-slate-600 mb-6">
              O Conselheiro IA é uma funcionalidade Premium. Tenha um especialista analisando seus dados e tirando dúvidas financeiras 24 horas por dia!
            </p>
            <button
              onClick={() => navigate('/plans')}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
            >
              Ver Planos Premium
            </button>
          </div>
        </div>
      )}

      {/* Chat Drawer/Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm sm:p-4">
          <div className="bg-white w-full sm:w-[400px] h-full sm:h-[600px] sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-right sm:slide-in-from-bottom-8">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Conselheiro IA</h3>
                  <p className="text-xs text-indigo-200">Online e pronto para ajudar</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-600 text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <span className="text-sm text-slate-500 ml-2">A IA está pensando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white sm:rounded-b-2xl">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte sobre suas finanças..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
