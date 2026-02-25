import { useEffect, useState, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { Transaction } from './types';
import { categoriasFinanceiras } from './constants';
import { format, startOfMonth, endOfMonth, isBefore, isSameMonth, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Charts } from './components/Charts';
import { Goals } from './components/Goals';
import { SmartWidgets } from './components/SmartWidgets';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions(silent = false) {
    try {
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setAllTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Lógica de Recorrência e Filtro do Mês
  const filteredTransactions = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);

    return allTransactions.filter((t) => {
      const tDate = parseISO(t.date);
      
      // Transação do mês exato
      if (isSameMonth(tDate, currentDate)) {
        return true;
      }
      
      // Transação recorrente de meses anteriores
      if (t.is_recurring && isBefore(tDate, start)) {
        return true;
      }

      return false;
    });
  }, [allTransactions, currentDate]);

  // Jejum de Gastos (Dias sem Gastos Variáveis)
  const spendingFastStreak = useMemo(() => {
    const today = startOfDay(new Date());
    
    // Filtra apenas despesas variáveis (exceto supermercado)
    const variableExpenses = allTransactions.filter(t => {
      if (t.type !== 'expense') return false;
      const category = categoriasFinanceiras.find(c => c.id === t.category);
      if (!category) return false;
      return !category.is_fixed && t.category !== 'supermercado';
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (variableExpenses.length === 0) {
      // Se não há despesas variáveis, a streak é desde o início ou 0
      return 0; // Ou poderíamos calcular desde a primeira transação
    }

    const lastVariableExpenseDate = startOfDay(parseISO(variableExpenses[0].date));
    
    // Se a última despesa foi hoje, a streak é 0
    if (lastVariableExpenseDate.getTime() === today.getTime()) {
      return 0;
    }

    // Se a última despesa foi no futuro (erro de inserção), ignora
    if (lastVariableExpenseDate.getTime() > today.getTime()) {
      return 0;
    }

    return differenceInDays(today, lastVariableExpenseDate);
  }, [allTransactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-8">
      <Header 
        currentDate={currentDate} 
        setCurrentDate={setCurrentDate} 
        spendingFastStreak={spendingFastStreak} 
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <SummaryCards transactions={filteredTransactions} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Charts transactions={filteredTransactions} />
            <TransactionList 
              transactions={filteredTransactions} 
              onTransactionDeleted={() => fetchTransactions(true)}
            />
          </div>
          
          <div className="space-y-8">
            <TransactionForm onTransactionAdded={() => fetchTransactions(true)} />
            <Goals allTransactions={allTransactions} />
            <SmartWidgets transactions={filteredTransactions} />
          </div>
        </div>
      </main>
    </div>
  );
}
