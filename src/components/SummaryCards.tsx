import { useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';

interface SummaryCardsProps {
  transactions: Transaction[];
}

export function SummaryCards({ transactions }: SummaryCardsProps) {
  const { income, expense, balance } = useMemo(() => {
    return transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'income') {
          acc.income += Number(curr.amount);
          acc.balance += Number(curr.amount);
        } else {
          acc.expense += Number(curr.amount);
          acc.balance -= Number(curr.amount);
        }
        return acc;
      },
      { income: 0, expense: 0, balance: 0 }
    );
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">Saldo Atual</p>
          <div className="bg-indigo-50 p-2 rounded-lg">
            <Wallet className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        <p className={`text-3xl font-bold mt-4 ${balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
          {formatCurrency(balance)}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">Receitas</p>
          <div className="bg-emerald-50 p-2 rounded-lg">
            <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
        <p className="text-3xl font-bold mt-4 text-emerald-600">
          {formatCurrency(income)}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">Despesas</p>
          <div className="bg-red-50 p-2 rounded-lg">
            <ArrowDownCircle className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <p className="text-3xl font-bold mt-4 text-red-600">
          {formatCurrency(expense)}
        </p>
      </div>
    </div>
  );
}
