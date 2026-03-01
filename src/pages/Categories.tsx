import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trash2, Tag, AlertCircle } from 'lucide-react';
import { TransactionType } from '../types';

export function Categories() {
  const { categories, profile, refreshCategories } = useAppContext();
  const navigate = useNavigate();
  
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [newColor, setNewColor] = useState('#6366f1'); // Default indigo
  const [loading, setLoading] = useState(false);

  const isProOrLifetime = profile?.plan_type === 'pro' || profile?.plan_type === 'lifetime';

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProOrLifetime || !newLabel) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('categories').insert([{
        user_id: user.id,
        label: newLabel,
        type: newType,
        color: newColor,
        is_fixed: false,
      }]);

      if (error) throw error;

      setNewLabel('');
      await refreshCategories();
    } catch (error: any) {
      console.error('Error adding category:', error);
      alert(error.message || 'Erro ao adicionar categoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!isProOrLifetime) return;
    
    // Check if it's a default category (they don't have UUIDs, usually simple strings)
    // Assuming custom categories have UUIDs
    if (!id.includes('-')) {
      alert('Não é possível excluir categorias padrão do sistema.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.message || 'Erro ao excluir categoria.');
    } finally {
      setLoading(false);
    }
  };

  if (!isProOrLifetime) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Recurso Exclusivo
            </h2>
            <p className="text-slate-600 mb-8 max-w-md">
              A criação e edição de categorias personalizadas está disponível apenas para assinantes dos planos Pro e Vitalício.
            </p>
            <button
              onClick={() => navigate('/plans')}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              Fazer Upgrade Agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  const customCategories = categories
    .filter(c => c.id.includes('-'))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Categorias Personalizadas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie suas próprias categorias de receitas e despesas.
          </p>
        </div>

        {/* Add Category Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            Nova Categoria
          </h3>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setNewType('expense')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  newType === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setNewType('income')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  newType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Receita
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Ex: Viagem, Cursos..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Cor</label>
                <input
                  type="color"
                  required
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newLabel}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adicionando...' : 'Adicionar Categoria'}
            </button>
          </form>
        </div>

        {/* Custom Categories List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            Suas Categorias
          </h3>
          
          {customCategories.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">
              Você ainda não criou nenhuma categoria personalizada.
            </p>
          ) : (
            <ul className="space-y-3">
              {customCategories.map((category) => (
                <li key={category.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{category.label}</p>
                      <p className="text-xs text-slate-500">
                        {category.type === 'income' ? 'Receita' : 'Despesa'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
