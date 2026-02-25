import { useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { AlertTriangle, ShoppingCart, Lightbulb, Activity } from 'lucide-react';

interface SmartWidgetsProps {
  transactions: Transaction[];
}

export function SmartWidgets({ transactions }: SmartWidgetsProps) {
  const { income, lazer, assinaturas, supermercado } = useMemo(() => {
    return transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'income') acc.income += Number(curr.amount);
        if (curr.category === 'lazer_casal') acc.lazer += Number(curr.amount);
        if (curr.category === 'assinaturas') acc.assinaturas++;
        if (curr.category === 'supermercado') acc.supermercado += Number(curr.amount);
        return acc;
      },
      { income: 0, lazer: 0, assinaturas: 0, supermercado: 0 }
    );
  }, [transactions]);

  const lazerPercentage = income > 0 ? (lazer / income) * 100 : 0;
  const isLazerHigh = lazerPercentage > 15;
  const hasMultipleSubscriptions = assinaturas > 2;
  
  const supermercadoLimit = 1500;
  const supermercadoPercentage = Math.min((supermercado / supermercadoLimit) * 100, 100);
  const isSupermercadoHigh = supermercadoPercentage > 85;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Radar de Economia
        </h2>

        <div className="space-y-4">
          {isLazerHigh && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-900">Alerta de Lazer</h4>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                  Os gastos com lazer ({lazerPercentage.toFixed(1)}%) ultrapassaram 15% das receitas deste mês. Considere reduzir saídas.
                </p>
              </div>
            </div>
          )}

          {hasMultipleSubscriptions && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900">Revisão de Assinaturas</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Detetamos {assinaturas} assinaturas ativas. Revise se todas são realmente necessárias para otimizar o orçamento.
                </p>
              </div>
            </div>
          )}

          {!isLazerHigh && !hasMultipleSubscriptions && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 items-start">
              <Lightbulb className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-900">Tudo sob controle!</h4>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Seus gastos com lazer e assinaturas estão dentro do esperado. Continue assim!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-indigo-600" />
          Alerta de Supermercado
        </h2>

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Gasto Atual</span>
            <span className={`text-sm font-bold ${isSupermercadoHigh ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatCurrency(supermercado)}
            </span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
                isSupermercadoHigh ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${supermercadoPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-500">0</span>
            <span className="text-slate-500">Teto: {formatCurrency(supermercadoLimit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
