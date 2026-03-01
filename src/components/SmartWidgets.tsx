import { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { AlertTriangle, ShoppingCart, Lightbulb, Activity, Edit2, Check, X, Lock, Plus, Trash2 } from 'lucide-react';
import { useUserSettings, AlertSetting } from '../contexts/useUserSettings';
import { useAppContext } from '../contexts/AppContext';

interface SmartWidgetsProps {
  transactions: Transaction[];
}

export function SmartWidgets({ transactions }: SmartWidgetsProps) {
  const { profile, categories } = useAppContext();
  const { settings, updateSettings } = useUserSettings();
  const isPaidPlan = profile?.plan_type === 'pro' || profile?.plan_type === 'lifetime';

  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [alertInput, setAlertInput] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [newAlertCategory, setNewAlertCategory] = useState('');
  const [newAlertLimit, setNewAlertLimit] = useState('');

  const { income, lazer, assinaturas } = useMemo(() => {
    return transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'income') acc.income += Number(curr.amount);
        if (curr.category === 'lazer_casal') acc.lazer += Number(curr.amount);
        if (curr.category === 'assinaturas') acc.assinaturas++;
        return acc;
      },
      { income: 0, lazer: 0, assinaturas: 0 }
    );
  }, [transactions]);

  const lazerPercentage = income > 0 ? (lazer / income) * 100 : 0;
  const isLazerHigh = lazerPercentage > 15;
  const hasMultipleSubscriptions = assinaturas > 2;

  const handleSaveAlert = (alertId: string) => {
    const val = parseFloat(alertInput);
    if (!isNaN(val) && val > 0) {
      updateSettings({
        ...settings,
        alerts: settings.alerts.map(a => a.id === alertId ? { ...a, limit: val } : a)
      });
    }
    setEditingAlertId(null);
  };

  const handleDeleteAlert = (alertId: string) => {
    updateSettings({
      ...settings,
      alerts: settings.alerts.filter(a => a.id !== alertId)
    });
  };

  const handleCreateAlert = () => {
    const val = parseFloat(newAlertLimit);
    if (newAlertCategory && !isNaN(val) && val > 0) {
      const newAlert: AlertSetting = {
        id: `alert-${Date.now()}`,
        categoryId: newAlertCategory,
        limit: val
      };
      updateSettings({
        ...settings,
        alerts: [...settings.alerts, newAlert]
      });
      setIsCreating(false);
      setNewAlertCategory('');
      setNewAlertLimit('');
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense').sort((a, b) => a.label.localeCompare(b.label));

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-indigo-600" />
            Meus Alertas
          </h2>
          {isPaidPlan ? (
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Novo Alerta
            </button>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider" title="Disponível no Plano Pro">
              <Lock className="w-3 h-3" /> Pro
            </span>
          )}
        </div>

        <div className="space-y-4">
          {isCreating && isPaidPlan && (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-sm font-semibold text-indigo-900 mb-3">Criar Novo Alerta</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-800 mb-1">Categoria</label>
                  <select
                    value={newAlertCategory}
                    onChange={(e) => setNewAlertCategory(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    <option value="" disabled>Selecione...</option>
                    {expenseCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-800 mb-1">Teto (R$)</label>
                  <input
                    type="number"
                    value={newAlertLimit}
                    onChange={(e) => setNewAlertLimit(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Ex: 500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateAlert}
                  disabled={!newAlertCategory || !newAlertLimit}
                  className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Salvar Alerta
                </button>
              </div>
            </div>
          )}

          {settings.alerts.length === 0 && !isCreating && (
            <p className="text-sm text-slate-500 text-center py-4">Nenhum alerta configurado.</p>
          )}

          {settings.alerts.map(alert => {
            const categoryObj = categories.find(c => c.id === alert.categoryId);
            const categoryName = categoryObj ? categoryObj.label : 'Categoria Excluída';
            
            const spent = transactions
              .filter(t => t.category === alert.categoryId)
              .reduce((acc, curr) => acc + Number(curr.amount), 0);
            
            const percentage = Math.min((spent / alert.limit) * 100, 100);
            const isHigh = percentage > 85;

            return (
              <div key={alert.id} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">Alerta: {categoryName}</span>
                    {alert.id !== 'default-supermercado' && isPaidPlan && (
                      <button 
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Excluir Alerta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className={`text-sm font-bold ${isHigh ? 'text-rose-600' : 'text-slate-900'}`}>
                    {formatCurrency(spent)}
                  </span>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
                      isHigh ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-500">0</span>
                  
                  {editingAlertId === alert.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Teto:</span>
                      <input 
                        type="number" 
                        value={alertInput}
                        onChange={(e) => setAlertInput(e.target.value)}
                        className="w-20 px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:border-indigo-500"
                      />
                      <button onClick={() => handleSaveAlert(alert.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => setEditingAlertId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Teto: {formatCurrency(alert.limit)}</span>
                      {isPaidPlan ? (
                        <button 
                          onClick={() => { setAlertInput(alert.limit.toString()); setEditingAlertId(alert.id); }}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Editar Teto"
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
