import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, CreditCard, LogOut, Tags, Crown, Calendar, BarChart3 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Logo } from './Logo';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAppContext();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Análises', icon: BarChart3 },
    { path: '/categories', label: 'Categorias', icon: Tags },
    { path: '/events', label: 'Meus Eventos', icon: Calendar },
    { path: '/plans', label: 'Meu Plano', icon: CreditCard },
  ];

  const getPlanBadge = () => {
    if (!profile) return null;
    
    switch (profile.plan_type) {
      case 'pro':
        return (
          <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
            <Crown className="w-3 h-3" /> Pro
          </span>
        );
      case 'lifetime':
        return (
          <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold uppercase tracking-wider">
            <Crown className="w-3 h-3" /> Vitalício
          </span>
        );
      default:
        return (
          <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
            Básico
          </span>
        );
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <Logo className="w-8 h-8 rounded-lg shadow-sm" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight">Finanças</span>
                {getPlanBadge()}
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-slate-100 bg-white">
        <div className="flex justify-around py-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[4rem] transition-colors ${
                  isActive
                    ? 'text-indigo-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
