import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import { PlusCircle, Calendar, ArrowRight, Lock, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';

export function Events() {
  const { profile } = useAppContext();
  const navigate = useNavigate();
  const [events, setEvents] = useState<(Event & { spent: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPaidPlan = profile?.plan_type === 'pro' || profile?.plan_type === 'lifetime';

  useEffect(() => {
    if (isPaidPlan) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [isPaidPlan]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch transactions for these events to calculate spent
      const eventIds = eventsData?.map(e => e.id) || [];
      let transactionsData: any[] = [];
      
      if (eventIds.length > 0) {
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('event_id, amount, type')
          .in('event_id', eventIds);
          
        if (txError) throw txError;
        transactionsData = txData || [];
      }

      const eventsWithSpent = (eventsData || []).map(event => {
        const spent = transactionsData
          .filter(t => t.event_id === event.id && t.type === 'expense')
          .reduce((acc, curr) => acc + Number(curr.amount), 0);
        return { ...event, spent };
      });

      setEvents(eventsWithSpent);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !budget) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        title,
        budget: parseFloat(budget)
      });

      if (error) throw error;

      setShowModal(false);
      setTitle('');
      setBudget('');
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erro ao criar evento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isPaidPlan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center border border-slate-200">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Modo Evento Especial</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            O Modo Evento Especial é uma funcionalidade Premium. Crie orçamentos isolados para viagens, festas e reformas sem bagunçar suas despesas mensais!
          </p>
          <button
            onClick={() => navigate('/plans')}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Ver Planos Premium
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 px-4 mt-3 text-slate-500 hover:text-slate-700 font-medium rounded-xl transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Meus Eventos
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Orçamentos isolados para ocasiões especiais.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            Novo Evento
          </button>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum evento criado</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Crie seu primeiro evento para começar a controlar os gastos de forma isolada.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const percentage = Math.min((event.spent / event.budget) * 100, 100);
              const isOverBudget = event.spent > event.budget;

              return (
                <Link 
                  key={event.id} 
                  to={`/events/${event.id}`}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group block"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors shrink-0">
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Gasto</span>
                        <span className={`font-semibold ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                          {formatCurrency(event.spent)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-slate-400">0</span>
                        <span className="text-slate-500 font-medium">Orçamento: {formatCurrency(event.budget)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Create Event Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl relative animate-in fade-in zoom-in-95">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-600" />
                Criar Novo Evento
              </h3>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título do Evento</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ex: Viagem de Férias, Aniversário..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Orçamento Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 px-4 text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Criar Evento'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
