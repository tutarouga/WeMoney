import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Event, Transaction } from '../types';
import { ArrowLeft, Calendar, PlusCircle, Trash2, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAppContext } from '../contexts/AppContext';

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories } = useAppContext();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('event_id', id)
        .order('date', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

    } catch (error) {
      console.error('Error fetching event details:', error);
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date || !category || !event) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('transactions').insert({
        type: 'expense', // Event transactions are typically expenses
        amount: parseFloat(amount),
        category,
        description,
        date,
        is_recurring: false,
        user_id: user.id,
        event_id: event.id
      });

      if (error) throw error;

      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      fetchEventData(); // Refresh data
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao adicionar despesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('transactions').delete().eq('id', txId).eq('user_id', user.id);
      
      if (error) throw error;
      
      fetchEventData(); // Refresh data
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Erro ao excluir despesa.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) return null;

  const totalSpent = transactions.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const percentage = Math.min((totalSpent / event.budget) * 100, 100);
  const isOverBudget = totalSpent > event.budget;
  const remaining = Math.max(0, event.budget - totalSpent);

  const expenseCategories = categories.filter(c => c.type === 'expense').sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/events" className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              {event.title}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Painel Isolado do Evento</p>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Orçamento Total</p>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(event.budget)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Total Gasto</p>
              <p className={`text-3xl font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Disponível</p>
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(remaining)}</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500 font-medium">Progresso do Orçamento</span>
              <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ease-out ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Transaction Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                Nova Despesa
              </h2>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="" disabled>Selecione uma categoria</option>
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ex: Decoração, Passagem..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Adicionar Despesa'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Despesas do Evento</h2>
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {transactions.length} registros
                </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ArrowDownRight className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500">Nenhuma despesa registrada para este evento.</p>
                  </div>
                ) : (
                  transactions.map((t) => {
                    const cat = categories.find(c => c.id === t.category);
                    return (
                      <div key={t.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors group flex items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                          <div className="p-3 rounded-xl shrink-0 bg-red-50 text-red-600">
                            <ArrowDownRight className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 break-words mb-1">{t.description}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                              <span>{formatDate(t.date)}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span 
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                                style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
                              >
                                {cat?.label || t.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-semibold text-slate-900">
                            -{formatCurrency(t.amount)}
                          </span>
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
