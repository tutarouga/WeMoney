import { Category } from './types';

export const categoriasFinanceiras: Category[] = [
  // Receitas
  { id: 'salario', label: 'Salário', type: 'income', color: '#10b981', is_fixed: true },
  { id: 'renda', label: 'Renda', type: 'income', color: '#34d399', is_fixed: false },
  { id: 'outros_receita', label: 'Outros', type: 'income', color: '#94a3b8', is_fixed: false },
  
  // Despesas
  { id: 'lazer', label: 'Lazer', type: 'expense', color: '#ec4899', is_fixed: false },
  { id: 'saude', label: 'Saúde', type: 'expense', color: '#ef4444', is_fixed: false },
  { id: 'contas', label: 'Contas', type: 'expense', color: '#f97316', is_fixed: true },
  { id: 'compras', label: 'Compras', type: 'expense', color: '#eab308', is_fixed: false },
  { id: 'outros_despesa', label: 'Outros', type: 'expense', color: '#94a3b8', is_fixed: false }
];
