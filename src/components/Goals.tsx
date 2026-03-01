import { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { Target, ShieldCheck, Edit2, Check, X, Lock } from 'lucide-react';
import { useUserSettings } from '../contexts/useUserSettings';
import { useAppContext } from '../contexts/AppContext';

interface GoalsProps {
  allTransactions: Transaction[];
}

export function Goals({ allTransactions }: GoalsProps) {
  const { profile } = useAppContext();
  const { settings, updateSettings } = useUserSettings();
  const isPaidPlan = profile?.plan_type === 'pro' || profile?.plan_type === 'lifetime';

  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emergencyInput, setEmergencyInput] = useState(settings.goals.emergencyTarget.toString());

  const [editingInvestment, setEditingInvestment] = useState(false);
  const [investmentInput, setInvestmentInput] = useState(settings.goals.investmentTarget.toString());

  const { emergencySaved, investmentSaved } = useMemo(() => {
    const emergency = allTransactions
      .filter(t => t.category === 'reserva_emergencia')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const investments = allTransactions
      .filter(t => t.category === 'investimento')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    return { 
      emergencySaved: emergency, 
      investmentSaved: investments,
    };
  }, [allTransactions]);

  const emergencyTarget = settings.goals.emergencyTarget;
  const investmentTarget = settings.goals.investmentTarget;

  const emergencyPercentage = Math.min((emergencySaved / emergencyTarget) * 100, 100);
  const investmentPercentage = Math.min((investmentSaved / investmentTarget) * 100, 100);

  const handleSaveEmergency = () => {
    const val = parseFloat(emergencyInput);
    if (!isNaN(val) && val > 0) {
      updateSettings({
        ...settings,
        goals: { ...settings.goals, emergencyTarget: val }
      });
    }
    setEditingEmergency(false);
  };

  const handleSaveInvestment = () => {
    const val = parseFloat(investmentInput);
    if (!isNaN(val) && val > 0) {
      updateSettings({
        ...settings,
        goals: { ...settings.goals, investmentTarget: val }
      });
    }
    setEditingInvestment(false);
  };

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
                
                {editingEmergency ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="number" 
                      value={emergencyInput}
                      onChange={(e) => setEmergencyInput(e.target.value)}
                      className="w-24 px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:border-teal-500"
                    />
                    <button onClick={handleSaveEmergency} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => setEditingEmergency(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-500">Meta: {formatCurrency(emergencyTarget)}</p>
                    {isPaidPlan ? (
                      <button 
                        onClick={() => { setEmergencyInput(emergencyTarget.toString()); setEditingEmergency(true); }}
                        className="text-slate-400 hover:text-teal-600 transition-colors"
                        title="Editar Meta"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-500 uppercase tracking-wider" title="Disponível no Plano Pro">
                        <Lock className="w-2.5 h-2.5" /> Pro
                      </span>
                    )}
                  </div>
                )}
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
                
                {editingInvestment ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="number" 
                      value={investmentInput}
                      onChange={(e) => setInvestmentInput(e.target.value)}
                      className="w-24 px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:border-indigo-500"
                    />
                    <button onClick={handleSaveInvestment} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => setEditingInvestment(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-500">Meta: {formatCurrency(investmentTarget)}</p>
                    {isPaidPlan ? (
                      <button 
                        onClick={() => { setInvestmentInput(investmentTarget.toString()); setEditingInvestment(true); }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Editar Meta"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-500 uppercase tracking-wider" title="Disponível no Plano Pro">
                        <Lock className="w-2.5 h-2.5" /> Pro
                      </span>
                    )}
                  </div>
                )}
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
