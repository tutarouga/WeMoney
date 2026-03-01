import React, { useState } from 'react';
import { Download, Lock, X, Table } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '../types';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';

interface ExcelExporterProps {
  transactions: Transaction[];
}

export function ExcelExporter({ transactions }: ExcelExporterProps) {
  const { profile, categories } = useAppContext();
  const navigate = useNavigate();
  const [showPaywall, setShowPaywall] = useState(false);

  const isPaidPlan = profile?.plan_type === 'pro' || profile?.plan_type === 'lifetime';

  const handleExport = () => {
    if (!isPaidPlan) {
      setShowPaywall(true);
      return;
    }

    if (transactions.length === 0) {
      alert('Não há transações para exportar.');
      return;
    }

    // Formatar os dados para o Excel
    const dataToExport = transactions.map(t => {
      const categoryLabel = categories.find(c => c.id === t.category)?.label || t.category;
      const typeLabel = t.type === 'income' ? 'Receita' : 'Despesa';
      
      return {
        'Data': format(parseISO(t.date), 'dd/MM/yyyy'),
        'Descrição': t.description,
        'Categoria': categoryLabel,
        'Tipo': typeLabel,
        'Valor': Number(t.amount)
      };
    });

    // Criar a planilha
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Ajustar a largura das colunas
    const colWidths = [
      { wch: 12 }, // Data
      { wch: 30 }, // Descrição
      { wch: 20 }, // Categoria
      { wch: 10 }, // Tipo
      { wch: 15 }  // Valor
    ];
    worksheet['!cols'] = colWidths;

    // Criar o workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');

    // Gerar o arquivo e forçar o download
    XLSX.writeFile(workbook, 'Nossas_Financas_Exportacao.xlsx');

    // Alerta de sucesso
    alert('Exportação concluída com sucesso!');
  };

  return (
    <>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-medium rounded-xl transition-colors shadow-sm text-sm"
      >
        <Table className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar Excel</span>
      </button>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Table className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
              Exportação para Excel
            </h3>
            <p className="text-center text-slate-600 mb-6">
              A Exportação Completa de Dados é uma funcionalidade Premium. Tenha o controle absoluto baixando seu histórico financeiro para o Excel!
            </p>
            <button
              onClick={() => navigate('/plans')}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
            >
              Ver Planos Premium
            </button>
          </div>
        </div>
      )}
    </>
  );
}
