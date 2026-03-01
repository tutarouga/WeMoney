import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TransactionType } from '../types';
import { PlusCircle, Baby, Repeat, Layers, Lock, Camera, X } from 'lucide-react';
import { addMonths } from 'date-fns';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';

interface TransactionFormProps {
  onTransactionAdded: () => void;
}

export function TransactionForm({ onTransactionAdded }: TransactionFormProps) {
  const { categories, profile } = useAppContext();
  const navigate = useNavigate();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState('2');
  const [unitCount, setUnitCount] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPaidPlan = profile?.plan_type === 'pro' || profile?.plan_type === 'lifetime';

  const filteredCategories = categories
    .filter(c => c.type === type)
    .sort((a, b) => a.label.localeCompare(b.label));

  const handleScanClick = () => {
    if (!isPaidPlan) {
      setShowPaywallModal(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      setScanMessage('Analisando cupom fiscal com IA...');

      const result = await Tesseract.recognize(file, 'por', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setScanMessage(`Lendo texto... ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const text = result.data.text;
      console.log('Extracted text:', text);

      // Regex for total value
      const valueRegex = /(?:TOTAL|VALOR A PAGAR|VALOR TOTAL|PAGAR).*?(?:R\$)?\s*(\d+[.,]\d{2})/i;
      const matchValue = text.match(valueRegex);
      
      let extractedAmount = '';
      if (matchValue && matchValue[1]) {
        extractedAmount = matchValue[1].replace(',', '.');
      } else {
        // Fallback: find all numbers like 123,45 and pick the largest reasonable one
        const allNumbers = [...text.matchAll(/(\d+[.,]\d{2})/g)].map(m => parseFloat(m[1].replace(',', '.')));
        if (allNumbers.length > 0) {
          extractedAmount = Math.max(...allNumbers).toString();
        }
      }

      // Regex for date
      const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/;
      const matchDate = text.match(dateRegex);
      let extractedDate = '';
      if (matchDate) {
        // Format to YYYY-MM-DD
        extractedDate = `${matchDate[3]}-${matchDate[2]}-${matchDate[1]}`;
      }

      if (extractedAmount) {
        setAmount(extractedAmount);
        setDescription('Compra lida via Cupom');
        if (extractedDate) {
          setDate(extractedDate);
        }
        alert('Dados extraídos! Revise a categoria antes de salvar.');
      } else {
        alert('Não conseguimos ler o valor com clareza. Por favor, preencha manualmente.');
      }

    } catch (error) {
      console.error('OCR Error:', error);
      alert('Erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsScanning(false);
      setScanMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description || !date) return;

    try {
      setLoading(true);
      
      const totalAmount = parseFloat(amount);
      const baseDate = new Date(date);
      // Adjust for timezone issues when parsing YYYY-MM-DD
      baseDate.setMinutes(baseDate.getMinutes() + baseDate.getTimezoneOffset());

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const transactionsToInsert = [];

      if (isInstallment) {
        const count = parseInt(installmentsCount);
        if (isNaN(count) || count < 2) throw new Error('Número de parcelas inválido');
        
        const installmentAmount = totalAmount / count;
        
        for (let i = 0; i < count; i++) {
          const installmentDate = addMonths(baseDate, i);
          transactionsToInsert.push({
            type,
            amount: installmentAmount,
            category,
            description: `${description} (${i + 1}/${count})`,
            date: installmentDate.toISOString().split('T')[0],
            is_recurring: false, // Installments are not recurring indefinitely
            unit_count: category === 'fraldas_higiene_thomas' && unitCount ? parseInt(unitCount) : null,
            user_id: user.id,
          });
        }
      } else {
        transactionsToInsert.push({
          type,
          amount: totalAmount,
          category,
          description,
          date,
          is_recurring: isRecurring,
          unit_count: category === 'fraldas_higiene_thomas' && unitCount ? parseInt(unitCount) : null,
          user_id: user.id,
        });
      }

      const { error } = await supabase.from('transactions').insert(transactionsToInsert);

      if (error) throw error;

      // Reset form
      setAmount('');
      setDescription('');
      setIsRecurring(false);
      setIsInstallment(false);
      setInstallmentsCount('2');
      setUnitCount('');
      onTransactionAdded();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao adicionar transação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative">
      {isScanning && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-900 font-medium">{scanMessage}</p>
        </div>
      )}

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
              <Camera className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
              Leitor Inteligente de Cupons
            </h3>
            <p className="text-center text-slate-600 mb-6">
              O Leitor Inteligente de Cupons é uma funcionalidade Premium. Economize tempo escaneando suas notas fiscais automaticamente!
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

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-indigo-600" />
          Nova Transação
        </h2>
        
        <button
          type="button"
          onClick={handleScanClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Escanear Cupom</span>
          <span className="sm:hidden">Escanear</span>
        </button>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setType('expense'); setCategory(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => { setType('income'); setCategory(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Receita
          </button>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {isInstallment ? 'Valor Total (R$)' : 'Valor (R$)'}
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="" disabled>Selecione uma categoria</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Fraldômetro */}
        {category === 'fraldas_higiene_thomas' && (
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Baby className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-purple-900 mb-1">Fraldômetro (Qtd. no Pacote)</label>
              <input
                type="number"
                value={unitCount}
                onChange={(e) => setUnitCount(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                placeholder="Ex: 48"
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Ex: Conta de Luz"
          />
        </div>

        <div className="space-y-2">
          {/* Recurring Toggle */}
          {!isInstallment && (
            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <div className={`p-1.5 rounded-lg ${isRecurring ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                <Repeat className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Fixar no Mês</p>
                <p className="text-xs text-slate-500">Repetir automaticamente</p>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </label>
          )}

          {/* Installment Toggle */}
          {!isRecurring && (
            <div className="space-y-2">
              <label 
                className={`flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl transition-colors ${
                  isPaidPlan ? 'cursor-pointer hover:bg-slate-100' : 'opacity-75 cursor-not-allowed'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isInstallment ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">Parcelar</p>
                    {!isPaidPlan && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                        <Lock className="w-3 h-3" /> Pro
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Dividir em vários meses</p>
                </div>
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => isPaidPlan && setIsInstallment(e.target.checked)}
                  disabled={!isPaidPlan}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 disabled:opacity-50"
                />
              </label>

              {isInstallment && isPaidPlan && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-indigo-900 whitespace-nowrap">
                    Nº de Parcelas:
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="48"
                    required
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(e.target.value)}
                    className="w-20 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  {amount && parseInt(installmentsCount) > 0 && (
                    <span className="text-xs text-indigo-600 ml-auto">
                      {installmentsCount}x de {(parseFloat(amount) / parseInt(installmentsCount)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Adicionar Transação'
          )}
        </button>
      </form>
    </div>
  );
}
