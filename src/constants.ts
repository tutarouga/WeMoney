import { Category } from './types';

export const categoriasFinanceiras: Category[] = [
  { id: 'salario', label: 'Salário', type: 'income', color: '#10b981', is_fixed: true },
  { id: 'aluguel', label: 'Aluguel', type: 'income', color: '#059669', is_fixed: true },
  { id: 'investimento', label: 'Investimento', type: 'income', color: '#047857', is_fixed: false },
  { id: 'freelance', label: 'Freelance', type: 'income', color: '#10b981', is_fixed: false },
  { id: 'presente', label: 'Presente', type: 'income', color: '#34d399', is_fixed: false },
  { id: 'renda_extra', label: 'Renda Extra', type: 'income', color: '#6ee7b7', is_fixed: false },
  { id: 'outros_receita', label: 'Outros', type: 'income', color: '#94a3b8', is_fixed: false },
  { id: 'moradia', label: 'Moradia', type: 'expense', color: '#ef4444', is_fixed: true },
  { id: 'contas_basicas', label: 'Contas Básicas', type: 'expense', color: '#f97316', is_fixed: true },
  { id: 'supermercado', label: 'Supermercado (Nacional, Feira)', type: 'expense', color: '#eab308', is_fixed: false },
  { id: 'transporte', label: 'Transporte', type: 'expense', color: '#3b82f6', is_fixed: false },
  { id: 'saude', label: 'Saúde', type: 'expense', color: '#ef4444', is_fixed: false },
  { id: 'fraldas_higiene_thomas', label: 'Fraldas e Higiene (Thomas)', type: 'expense', color: '#8b5cf6', is_fixed: false },
  { id: 'saude_thomas', label: 'Saúde (Thomas)', type: 'expense', color: '#a855f7', is_fixed: false },
  { id: 'vestuario_thomas', label: 'Vestuário (Thomas)', type: 'expense', color: '#d946ef', is_fixed: false },
  { id: 'lazer_casal', label: 'Lazer do Casal', type: 'expense', color: '#ec4899', is_fixed: false },
  { id: 'assinaturas', label: 'Assinaturas', type: 'expense', color: '#64748b', is_fixed: true },
  { id: 'reserva_emergencia', label: 'Reserva de Emergência', type: 'expense', color: '#14b8a6', is_fixed: false },
  { id: 'outros_despesa', label: 'Outros', type: 'expense', color: '#94a3b8', is_fixed: false }
];
