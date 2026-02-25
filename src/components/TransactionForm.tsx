import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { categoriasFinanceiras } from '../constants';
import { TransactionType } from '../types';
import { PlusCircle, Baby, Repeat } from 'lucide-react';

interface TransactionFormProps {
  onTransactionAdded: () => void;
}

export function TransactionForm({ onTransactionAdded }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [unitCount, setUnitCount] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredCategories = categoriasFinanceiras.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description || !date) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('transactions').insert([
        {
          type,
          amount: parseFloat(amount),
          category,
          description,
          date,
          is_recurring: isRecurring,
          unit_count: category === 'fraldas_higiene_thomas' && unitCount ? parseInt(unitCount) : null,
        } as any,
      ]);

      if (error) throw error;

      // Reset form
      setAmount('');
      setDescription('');
      setIsRecurring(false);
      setUnitCount('');
      onTransactionAdded();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao adicionar transação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-indigo-600" />
        Nova Transação
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setType('expense'); setCategory(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => { setType('income'); setCategory(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Receita
          </button>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="" disabled>Selecione uma categoria</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Fraldômetro */}
        {category === 'fraldas_higiene_thomas' && (
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Baby className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-purple-900 mb-1">Fraldômetro (Qtd. no Pacote)</label>
              <input
                type="number"
                value={unitCount}
                onChange={(e) => setUnitCount(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                placeholder="Ex: 48"
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Ex: Conta de Luz"
          />
        </div>

        {/* Recurring Toggle */}
        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
          <div className={`p-1.5 rounded-lg ${isRecurring ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
            <Repeat className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Fixar no Mês</p>
            <p className="text-xs text-slate-500">Repetir automaticamente</p>
          </div>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Adicionar Transação'
          )}
        </button>
      </form>
    </div>
  );
}
