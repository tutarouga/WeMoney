import { Mail, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Navigate } from 'react-router-dom';

export function Support() {
  const { profile } = useAppContext();

  if (profile?.plan_type !== 'lifetime') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Suporte Prioritário - Plano Vitalício</h2>
          <p className="text-slate-600 mb-8">
            Como membro do Plano Vitalício, você tem acesso direto ao criador para suporte prioritário e para solicitar acesso aos outros aplicativos do nosso ecossistema.
          </p>
          
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 inline-block">
            <div className="flex items-center gap-3 text-lg font-medium text-slate-900">
              <Mail className="w-5 h-5 text-indigo-600" />
              <a href="mailto:matheussantana53@gmail.com" className="hover:text-indigo-600 transition-colors">
                matheussantana53@gmail.com
              </a>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 mt-8">
            Envie um email para solicitar adesão vitalícia aos outros aplicativos ou para tirar dúvidas. Responderemos o mais rápido possível.
          </p>
        </div>
      </div>
    </div>
  );
}
