import { Check, Star, Zap } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export function Plans() {
  const { profile } = useAppContext();
  const currentPlan = profile?.plan_type || 'free';

  const handleSubscribe = (plan: string) => {
    if (!profile?.id) {
      alert('Usuário não identificado. Por favor, faça login novamente.');
      return;
    }

    if (plan === 'Pro') {
      window.open(`https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=cee5205f07bc49d89a1a529de2847a8b&external_reference=${profile.id}`, '_blank');
    } else if (plan === 'Vitalício') {
      // For standard checkout links, we can append external_reference
      window.open(`https://mpago.li/1ym7qKV?external_reference=${profile.id}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Escolha o plano ideal para você
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Comece grátis e faça o upgrade quando precisar de mais recursos para controlar suas finanças.
          </p>
        </div>

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

          {/* Pro */}
          <div className={`bg-indigo-600 rounded-3xl p-8 border ${currentPlan === 'pro' ? 'border-white ring-4 ring-indigo-300' : 'border-indigo-500'} shadow-xl shadow-indigo-200 flex flex-col relative transform md:-translate-y-4`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
              {currentPlan === 'pro' && (
                <span className="bg-white text-indigo-600 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm mb-1">
                  Seu Plano Atual
                </span>
              )}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 fill-current" /> Mais Popular
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 mt-4">Pro</h3>
            <p className="text-indigo-200 text-sm mb-6">Recursos avançados para controle total.</p>
            <div className="mb-6 flex flex-col gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">R$ 4,90</span>
                <span className="text-indigo-200">/mês</span>
              </div>
              <span className="text-xs font-medium text-amber-300 bg-white/10 w-fit px-2 py-0.5 rounded-full mt-1">
                🎁 3 dias grátis para testar
              </span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Tudo do plano Básico
              </li>
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Função de Parcelamento
              </li>
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Gerenciamento de Categorias
              </li>
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Dashboards Avançados
              </li>
              <li className="flex items-center gap-3 text-indigo-100 text-sm">
                <Check className="w-5 h-5 text-indigo-300 shrink-0" />
                Mais Funcionalidades Premium
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('Pro')}
              disabled={currentPlan === 'pro' || currentPlan === 'lifetime'}
              className={`w-full py-3 px-4 text-sm font-semibold rounded-xl transition-colors shadow-sm ${
                currentPlan === 'pro'
                  ? 'bg-indigo-800 text-white cursor-default border border-indigo-700'
                  : currentPlan === 'lifetime'
                  ? 'bg-indigo-500 text-indigo-200 cursor-not-allowed border border-indigo-400'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {currentPlan === 'pro' ? 'Plano Ativo' : currentPlan === 'lifetime' ? 'Incluído no Vitalício' : 'Assinar com Mercado Pago'}
            </button>
            {currentPlan === 'pro' && (
              <a
                href="https://www.mercadopago.com.br/subscriptions"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-center text-sm text-indigo-200 hover:text-white transition-colors underline"
              >
                Gerenciar ou Cancelar Assinatura
              </a>
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
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Vitalício</h3>
            <p className="text-slate-500 text-sm mb-6">Pague uma vez, use para sempre.</p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900">R$ 699,00</span>
              <span className="text-slate-500">/único</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                Tudo do plano Pro
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
                Acesso Vitalício a Todos Outros Aplicativos do Mesmo Criador
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                Suporte Prioritário
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('Vitalício')}
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
