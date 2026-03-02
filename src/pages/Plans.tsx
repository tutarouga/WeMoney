import { Check, Star, Zap, Clock, Info } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

export function Plans() {
  const { profile, refreshCategories } = useAppContext();
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);
  const [showLifetimeInfo, setShowLifetimeInfo] = useState(false);
  
  const currentPlan = profile?.plan_type || 'free';
  const hasUsedTrial = profile?.trial_used === true;

  const handleActivateTrial = async () => {
    if (!profile?.id) return;
    
    setIsActivatingTrial(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      const { error } = await supabase
        .from('profiles')
        .update({
          plan_type: 'pro',
          trial_used: true,
          premium_expires_at: expiresAt.toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      await refreshCategories(); // Refresh context to update UI
      alert('Seu período de teste de 14 dias foi ativado com sucesso!');
    } catch (error) {
      console.error('Error activating trial:', error);
      alert('Ocorreu um erro ao ativar o período de teste. Tente novamente.');
    } finally {
      setIsActivatingTrial(false);
    }
  };

  const handleSubscribe = (plan: string) => {
    if (!profile?.id) {
      alert('Usuário não identificado. Por favor, faça login novamente.');
      return;
    }

    // Replace these URLs with your actual Mercado Pago checkout links for each package
    const links: Record<string, string> = {
      '1_month': 'https://mpago.la/2Z4wPW3',
      '3_months': 'https://mpago.la/2G6ecBN',
      '6_months': 'https://mpago.la/153q28W',
      '12_months': 'https://mpago.la/2Ae7dJ9',
      'lifetime': 'https://mpago.li/1ym7qKV'
    };

    const url = links[plan];
    if (url) {
      window.open(`${url}?external_reference=${profile.id}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Escolha o plano ideal para você
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Comece grátis e faça o upgrade quando precisar de mais recursos para controlar suas finanças. Sem assinaturas automáticas.
          </p>
        </div>

        {!hasUsedTrial && currentPlan === 'free' && (
          <div className="max-w-3xl mx-auto mb-12 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-center text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
              <Star className="w-6 h-6 fill-amber-300 text-amber-300" />
              Experimente o Premium de Graça
            </h3>
            <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
              Desbloqueie todos os recursos avançados, relatórios em PDF, exportação para Excel e o Conselheiro IA por 14 dias. Sem cartão de crédito.
            </p>
            <button
              onClick={handleActivateTrial}
              disabled={isActivatingTrial}
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-8 rounded-xl transition-colors shadow-md disabled:opacity-70"
            >
              {isActivatingTrial ? 'Ativando...' : 'Ativar 14 Dias Premium Grátis'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Básico */}
          <div className={`bg-white rounded-3xl p-8 border ${currentPlan === 'free' ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50' : 'border-slate-200'} shadow-sm flex flex-col relative`}>
            {currentPlan === 'free' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
                  Seu Plano Atual
                </span>
              </div>
            )}
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Básico</h3>
            <p className="text-slate-500 text-sm mb-6">Para quem está começando a se organizar.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900">Grátis</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                Controle de Receitas e Despesas
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                Categorias Básicas
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                Dashboard Simples
              </li>
            </ul>
            <button
              disabled
              className={`w-full py-3 px-4 text-sm font-medium rounded-xl border transition-colors ${
                currentPlan === 'free' 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 cursor-default' 
                  : 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
              }`}
            >
              {currentPlan === 'free' ? 'Plano Ativo' : 'Plano Básico'}
            </button>
          </div>

          {/* Premium (Pacotes) */}
          <div className={`bg-indigo-600 rounded-3xl p-8 border ${currentPlan === 'pro' ? 'border-white ring-4 ring-indigo-300' : 'border-indigo-500'} shadow-xl shadow-indigo-200 flex flex-col relative transform md:-translate-y-4`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
              {currentPlan === 'pro' && (
                <span className="bg-white text-indigo-600 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm mb-1">
                  Seu Plano Atual
                </span>
              )}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 fill-current" /> Premium
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 mt-4">Pacotes Premium</h3>
            <p className="text-indigo-200 text-sm mb-6">Pague apenas pelo tempo que usar. Sem renovação automática.</p>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Atualizações futuras inclusas
              </li>
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Gerenciamento de Categorias
              </li>
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Crie Eventos para Gastos Específicos
              </li>
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Função de Parcelamento
              </li>
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Relatórios em PDF e Excel
              </li>
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Conselheiro IA 24h
              </li>
            </ul>

            <div className="space-y-3">
              <button
                onClick={() => handleSubscribe('1_month')}
                disabled={currentPlan === 'lifetime'}
                className="w-full py-2 px-4 bg-white hover:bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-lg transition-colors shadow-sm flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>1 Mês</span>
                <span>R$ 9,90</span>
              </button>
              <button
                onClick={() => handleSubscribe('3_months')}
                disabled={currentPlan === 'lifetime'}
                className="w-full py-2 px-4 bg-white hover:bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-lg transition-colors shadow-sm flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>3 Meses <span className="text-xs text-emerald-500 font-bold ml-1">-10%</span></span>
                <span>R$ 26,70</span>
              </button>
              <button
                onClick={() => handleSubscribe('6_months')}
                disabled={currentPlan === 'lifetime'}
                className="w-full py-2 px-4 bg-white hover:bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-lg transition-colors shadow-sm flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>6 Meses <span className="text-xs text-emerald-500 font-bold ml-1">-15%</span></span>
                <span>R$ 50,40</span>
              </button>
              <button
                onClick={() => handleSubscribe('12_months')}
                disabled={currentPlan === 'lifetime'}
                className="w-full py-2 px-4 bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-bold rounded-lg transition-colors shadow-sm flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>1 Ano <span className="text-xs text-indigo-800 font-black ml-1">-20%</span></span>
                <span>R$ 95,00</span>
              </button>
            </div>
            
            {currentPlan === 'pro' && profile?.premium_expires_at && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-indigo-200">
                <Clock className="w-4 h-4" />
                <span>Expira em: {new Date(profile.premium_expires_at).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>

          {/* Vitalício */}
          <div className={`bg-white rounded-3xl p-8 border ${currentPlan === 'lifetime' ? 'border-amber-500 ring-2 ring-amber-500 ring-opacity-50' : 'border-slate-200'} shadow-sm flex flex-col relative`}>
            {currentPlan === 'lifetime' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
                  Seu Plano Atual
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-2 relative">
              <h3 className="text-xl font-semibold text-slate-900">Vitalício</h3>
              <button 
                onMouseEnter={() => setShowLifetimeInfo(true)}
                onMouseLeave={() => setShowLifetimeInfo(false)}
                onClick={() => setShowLifetimeInfo(!showLifetimeInfo)}
                className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
              >
                <Info className="w-5 h-5" />
              </button>
              
              {showLifetimeInfo && (
                <div className="absolute z-10 top-8 left-0 w-72 bg-slate-900 text-white text-xs rounded-xl p-4 shadow-xl border border-slate-700">
                  <p className="mb-2">Este plano é <strong>Vitalício</strong> até quando o aplicativo existir. Nunca mais terá cobrança adicional e o tempo para usar nunca expira.</p>
                  <p className="mb-2">Você está comprando acesso vitalício ao Nossas Finanças, mas também adquire o direito de acesso vitalício a outros aplicativos do mesmo criador.</p>
                  <p>Solicite adesão aos outros aplicativos através do <strong>suporte prioritário</strong>. O botão de suporte fica disponível no menu após a compra deste plano.</p>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-sm mb-6">Pague uma vez, use para sempre.</p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900">R$ 699,00</span>
              <span className="text-slate-500">/único</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                Tudo do plano Premium
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                Acesso Vitalício garantido
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                Atualizações futuras inclusas
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                Acesso a Todos Outros Apps
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                Suporte Prioritário
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('lifetime')}
              disabled={currentPlan === 'lifetime'}
              className={`w-full py-3 px-4 text-sm font-medium rounded-xl transition-colors shadow-sm ${
                currentPlan === 'lifetime'
                  ? 'bg-amber-100 text-amber-700 border border-amber-200 cursor-default'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {currentPlan === 'lifetime' ? 'Plano Ativo' : 'Comprar Acesso Vitalício'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
