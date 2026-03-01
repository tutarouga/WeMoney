import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { PieChart as PieChartIcon, Filter } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface ChartsProps {
  transactions: Transaction[];
}

export function Charts({ transactions }: ChartsProps) {
  const { categories } = useAppContext();
  const [filter, setFilter] = useState<'all' | 'fixed' | 'variable'>('all');

  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const filteredExpenses = expenses.filter(t => {
      if (filter === 'all') return true;
      const category = categories.find(c => c.id === t.category);
      if (!category) return false;
      return filter === 'fixed' ? category.is_fixed : !category.is_fixed;
    });

    const grouped = filteredExpenses.reduce((acc, curr) => {
      const category = categories.find(c => c.id === curr.category);
      const label = category?.label || curr.category;
      const color = category?.color || '#cbd5e1';

      if (!acc[label]) {
        acc[label] = { name: label, value: 0, color };
      }
      acc[label].value += Number(curr.amount);
      return acc;
    }, {} as Record<string, { name: string; value: number; color: string }>);

    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [transactions, filter, categories]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-indigo-600" />
          Distribuição de Despesas
        </h2>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('fixed')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'fixed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Fixas
          </button>
          <button
            onClick={() => setFilter('variable')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'variable' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Variáveis
          </button>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-8">
            <span className="text-sm text-slate-500 font-medium">Total</span>
            <span className="text-xl font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>
        </div>
      ) : (
        <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 gap-3">
          <Filter className="w-8 h-8 opacity-50" />
          <p className="text-sm">Nenhuma despesa encontrada para este filtro.</p>
        </div>
      )}
    </div>
  );
}
