import { useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { Target, ShieldCheck } from 'lucide-react';

interface GoalsProps {
  allTransactions: Transaction[];
}

export function Goals({ allTransactions }: GoalsProps) {
  const { emergencySaved, emergencyTarget, investmentSaved, investmentTarget } = useMemo(() => {
    const emergency = allTransactions
      .filter(t => t.category === 'reserva_emergencia')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const investments = allTransactions
      .filter(t => t.category === 'investimento')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    return { 
      emergencySaved: emergency, 
      emergencyTarget: 10000,
      investmentSaved: investments,
      investmentTarget: 5000 
    };
  }, [allTransactions]);

  const emergencyPercentage = Math.min((emergencySaved / emergencyTarget) * 100, 100);
  const investmentPercentage = Math.min((investmentSaved / investmentTarget) * 100, 100);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Target className="w-5 h-5 text-indigo-600" />
        Potes de Poupança
      </h2>

      <div className="space-y-6">
        {/* Fundo de Emergência */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-teal-100 p-2 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Fundo de Emergência</h3>
                <p className="text-xs text-slate-500">Meta: {formatCurrency(emergencyTarget)}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-teal-600">
              {emergencyPercentage.toFixed(0)}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
            <div 
              className="bg-teal-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${emergencyPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-900">{formatCurrency(emergencySaved)}</span>
            <span className="text-slate-500">Faltam {formatCurrency(Math.max(0, emergencyTarget - emergencySaved))}</span>
          </div>
        </div>

        {/* Investimentos */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Investimentos</h3>
                <p className="text-xs text-slate-500">Meta: {formatCurrency(investmentTarget)}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-indigo-600">
              {investmentPercentage.toFixed(0)}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
            <div 
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${investmentPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-900">{formatCurrency(investmentSaved)}</span>
            <span className="text-slate-500">Faltam {formatCurrency(Math.max(0, investmentTarget - investmentSaved))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
