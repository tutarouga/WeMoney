import { useState } from 'react';
import { Transaction } from '../types';
import { categoriasFinanceiras } from '../constants';
import { formatCurrency, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Trash2, Repeat, Baby, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionDeleted: () => Promise<void> | void;
}

export function TransactionList({ transactions, onTransactionDeleted }: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      
      if (error) throw error;
      
      await onTransactionDeleted();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      alert(error.message || 'Erro ao excluir transação. Verifique sua conexão.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
        <p className="text-slate-500">Nenhuma transação encontrada neste mês.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Histórico do Mês</h2>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {transactions.length} registros
        </span>
      </div>
      
      <div className="divide-y divide-slate-100">
        {transactions.map((t) => {
          const category = categoriasFinanceiras.find(c => c.id === t.category);
          const isIncome = t.type === 'income';
          const isFralda = t.category === 'fraldas_higiene_thomas' && t.unit_count;
          const unitCost = isFralda ? t.amount / t.unit_count! : null;

          return (
            <div key={t.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors group flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                <div 
                  className={`p-3 rounded-xl shrink-0 ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                >
                  {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-slate-900 truncate">{t.description}</p>
                    {t.is_recurring && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-medium shrink-0">
                        <Repeat className="w-3 h-3" />
                        Fixa
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span>{formatDate(t.date)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span 
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                      style={{ backgroundColor: `${category?.color}15`, color: category?.color }}
                    >
                      {category?.label || t.category}
                    </span>
                  </div>

                  {isFralda && unitCost && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-md w-fit">
                      <Baby className="w-3.5 h-3.5" />
                      Custo Unitário: {formatCurrency(unitCost)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                <span className={`font-semibold ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
                
                {confirmDeleteId === t.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === t.id ? 'Excluindo...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deletingId === t.id}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(t.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all focus:opacity-100"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
