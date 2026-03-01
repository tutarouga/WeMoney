import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { UploadCloud, FileText, Check, X, AlertCircle, Lock } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { formatCurrency } from '../lib/utils';

interface CSVImporterProps {
  onImportSuccess: () => void;
}

interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  originalCategory?: string;
}

export function CSVImporter({ onImportSuccess }: CSVImporterProps) {
  const { categories, profile } = useAppContext();
  const navigate = useNavigate();
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPaidPlan = profile?.plan_type === 'pro' || profile?.plan_type === 'lifetime';

  const handleImportClick = () => {
    if (!isPaidPlan) {
      setShowPaywallModal(true);
      return;
    }
    setShowImportModal(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      processFile(file);
    } else {
      alert('Por favor, selecione um arquivo CSV válido.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const guessCategory = (description: string, type: 'income' | 'expense'): string => {
    const descLower = description.toLowerCase();
    
    if (type === 'income') {
      if (descLower.includes('salário') || descLower.includes('salario') || descLower.includes('pagamento')) return 'salario';
      if (descLower.includes('rendimento') || descLower.includes('juros')) return 'renda';
      return 'outros_receita';
    }

    // Expense rules
    if (descLower.includes('ifood') || descLower.includes('zemilia') || descLower.includes('restaurante') || descLower.includes('lanche') || descLower.includes('mcdonalds') || descLower.includes('burger king')) {
      return 'alimentacao'; // Assuming 'alimentacao' exists, fallback to 'outros_despesa' if not found later
    }
    if (descLower.includes('uber') || descLower.includes('posto') || descLower.includes('gasolina') || descLower.includes('99') || descLower.includes('combustivel')) {
      return 'transporte';
    }
    if (descLower.includes('nacional') || descLower.includes('atacadão') || descLower.includes('mercado') || descLower.includes('carrefour') || descLower.includes('zaffari')) {
      return 'supermercado';
    }
    if (descLower.includes('fralda') || descLower.includes('farmácia') || descLower.includes('farmacia') || descLower.includes('pediátrica') || descLower.includes('pompom') || descLower.includes('panvel')) {
      return 'fraldas_higiene_thomas';
    }
    if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('prime') || descLower.includes('amazon') || descLower.includes('hbo') || descLower.includes('disney')) {
      return 'assinaturas';
    }
    if (descLower.includes('luz') || descLower.includes('agua') || descLower.includes('água') || descLower.includes('internet') || descLower.includes('telefone') || descLower.includes('celular')) {
      return 'contas_casa';
    }
    if (descLower.includes('shopee') || descLower.includes('mercado livre') || descLower.includes('amazon') || descLower.includes('shein')) {
      return 'compras';
    }
    if (descLower.includes('cinema') || descLower.includes('teatro') || descLower.includes('show') || descLower.includes('ingresso')) {
      return 'lazer_casal';
    }

    return 'outros_despesa';
  };

  const processFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: ParsedTransaction[] = [];
        
        results.data.forEach((row: any, index) => {
          // Try to find common column names
          const dateStr = row.Data || row.data || row.Date || row.date || '';
          const descStr = row.Descrição || row.Descricao || row.description || row.Description || row.Histórico || row.historico || '';
          const valStr = row.Valor || row.valor || row.Amount || row.amount || '';

          if (!dateStr || !descStr || !valStr) return;

          // Parse amount
          let amount = parseFloat(valStr.replace(/[R$\s.]/g, '').replace(',', '.'));
          if (isNaN(amount)) return;

          const type: 'income' | 'expense' = amount >= 0 ? 'income' : 'expense';
          amount = Math.abs(amount);

          // Parse date (assuming DD/MM/YYYY or YYYY-MM-DD)
          let date = new Date().toISOString().split('T')[0];
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              // Assume DD/MM/YYYY
              date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          } else if (dateStr.includes('-')) {
            date = dateStr;
          }

          const guessedCategory = guessCategory(descStr, type);
          
          // Verify if guessed category exists, otherwise fallback
          const categoryExists = categories.find(c => c.id === guessedCategory);
          const finalCategory = categoryExists ? guessedCategory : (type === 'income' ? 'outros_receita' : 'outros_despesa');

          parsed.push({
            id: `temp-${index}`,
            date,
            description: descStr,
            amount,
            type,
            category: finalCategory,
            originalCategory: finalCategory
          });
        });

        if (parsed.length > 0) {
          setParsedData(parsed);
        } else {
          alert('Não foi possível encontrar dados válidos no CSV. Verifique se as colunas são: Data, Descrição, Valor.');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Erro ao ler o arquivo CSV.');
      }
    });
  };

  const handleCategoryChange = (id: string, newCategory: string) => {
    setParsedData(prev => prev.map(t => t.id === id ? { ...t, category: newCategory } : t));
  };

  const handleRemoveRow = (id: string) => {
    setParsedData(prev => prev.filter(t => t.id !== id));
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;

    try {
      setIsImporting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const transactionsToInsert = parsedData.map(t => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
        is_recurring: false,
        user_id: user.id
      }));

      const { error } = await supabase.from('transactions').insert(transactionsToInsert);

      if (error) throw error;

      alert(`${parsedData.length} transações importadas com sucesso!`);
      setShowImportModal(false);
      setParsedData([]);
      onImportSuccess();
    } catch (error) {
      console.error('Error importing transactions:', error);
      alert('Erro ao importar transações. Tente novamente.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleImportClick}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors shadow-sm"
      >
        <UploadCloud className="w-4 h-4 text-indigo-600" />
        <span className="hidden sm:inline">Importar Extrato (CSV)</span>
        <span className="sm:hidden">Importar CSV</span>
      </button>

      {/* Paywall Modal */}
      {showPaywallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setShowPaywallModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <UploadCloud className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
              Importação Mágica de Extratos
            </h3>
            <p className="text-center text-slate-600 mb-6">
              A Importação Mágica de Extratos é uma funcionalidade Premium. Economize horas importando sua fatura do Nubank, Inter ou Itaú em 1 segundo!
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-xl relative my-8 animate-in fade-in zoom-in-95">
            <button 
              onClick={() => { setShowImportModal(false); setParsedData([]); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-indigo-600" />
              Importar Extrato (CSV)
            </h3>

            {parsedData.length === 0 ? (
              <div 
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
                  isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-700 font-medium mb-1">Arraste e solte seu arquivo CSV aqui</p>
                <p className="text-slate-500 text-sm mb-4">ou clique para selecionar do seu computador</p>
                <p className="text-xs text-slate-400">O arquivo deve conter as colunas: Data, Descrição, Valor</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Revisão de Transações</p>
                    <p>Encontramos {parsedData.length} transações. Nossa IA tentou adivinhar as categorias. Por favor, revise e ajuste se necessário antes de salvar.</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-medium">Data</th>
                        <th className="px-4 py-3 font-medium">Descrição</th>
                        <th className="px-4 py-3 font-medium text-right">Valor</th>
                        <th className="px-4 py-3 font-medium">Categoria</th>
                        <th className="px-4 py-3 font-medium text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                            {t.date.split('-').reverse().join('/')}
                          </td>
                          <td className="px-4 py-3 text-slate-900 font-medium">
                            {t.description}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={t.category}
                              onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 ${
                                t.category === t.originalCategory ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-300 text-slate-700'
                              }`}
                            >
                              {categories.filter(c => c.type === t.type).map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => handleRemoveRow(t.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1"
                              title="Remover linha"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setParsedData([])}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={isImporting}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isImporting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Confirmar e Salvar Transações
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
