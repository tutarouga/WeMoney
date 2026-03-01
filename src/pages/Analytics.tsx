import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Legend
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isSameMonth, eachDayOfInterval, eachMonthOfInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../lib/utils';
import { Lock, BarChart3, TrendingUp, PieChart, Activity, FileText, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type TimeFilter = '7days' | 'thisMonth' | '3months' | 'thisYear';

export function Analytics() {
  const { profile, categories } = useAppContext();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('thisMonth');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const isPaidPlan = profile?.plan_type === 'pro' || profile?.plan_type === 'lifetime';

  const getDates = () => {
    const today = new Date();
    switch (timeFilter) {
      case '7days':
        return { start: startOfDay(subDays(today, 6)), end: endOfDay(today) };
      case 'thisMonth':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case '3months':
        return { start: startOfMonth(subMonths(today, 2)), end: endOfMonth(today) };
      case 'thisYear':
        return { start: startOfYear(today), end: endOfYear(today) };
    }
  };

  useEffect(() => {
    if (isPaidPlan) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isPaidPlan, timeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { start, end } = getDates();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())
        .is('event_id', null) // Exclude event transactions
        .order('date', { ascending: true });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!isPaidPlan) {
      setShowPaywall(true);
      return;
    }

    if (!reportRef.current) return;

    try {
      setIsGeneratingPdf(true);
      
      // Wait a bit for the UI to update (hide buttons, etc)
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc', // match slate-50
      });

      const imgData = canvas.toDataURL('image/png');
      
      // A4 dimensions in mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add title and date
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('Relatório Financeiro', 15, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(`Emitido em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 15, 28);

      // Add the canvas image below the title
      pdf.addImage(imgData, 'PNG', 0, 35, pdfWidth, imgHeight);
      heightLeft -= (pdfHeight - 35);

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save('Relatorio_Nossas_Financas.pdf');
      alert('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Data Processing for Chart 1: Daily Evolution
  const dailyData = useMemo(() => {
    const { start, end } = getDates();
    const today = new Date();
    const daysInInterval = eachDayOfInterval({ start, end });

    let cumulativeExpense = 0;

    return daysInInterval.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTx = transactions.filter(t => t.date === dayStr && t.type === 'expense');
      const dayTotal = dayTx.reduce((acc, curr) => acc + Number(curr.amount), 0);
      
      // Only accumulate up to today
      if (startOfDay(day) <= startOfDay(today)) {
        cumulativeExpense += dayTotal;
      }

      return {
        day: format(day, 'dd/MM'),
        date: day,
        gastoDiario: dayTotal,
        acumulado: startOfDay(day) <= startOfDay(today) ? cumulativeExpense : null,
      };
    });
  }, [transactions, timeFilter]);

  // Data Processing for Chart 2: Category Radar (Top 5 Expenses overall)
  const radarData = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};

    transactions.filter(t => t.type === 'expense').forEach(t => {
      const catLabel = categories.find(c => c.id === t.category)?.label || t.category;
      expensesByCategory[catLabel] = (expensesByCategory[catLabel] || 0) + Number(t.amount);
    });

    const sortedCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([subject, A]) => ({
        subject,
        A,
        fullMark: Math.max(...Object.values(expensesByCategory)) * 1.1 // Add 10% padding
      }));

    return sortedCategories;
  }, [transactions, categories]);

  // Data Processing for Chart 3: Income vs Expense
  const monthlyData = useMemo(() => {
    const { start, end } = getDates();
    const monthsInInterval = eachMonthOfInterval({ start, end });

    return monthsInInterval.map(month => {
      const monthTx = transactions.filter(t => isSameMonth(parseISO(t.date), month));
      
      const income = monthTx
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);
        
      const expense = monthTx
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        Receitas: income,
        Despesas: expense,
      };
    });
  }, [transactions, timeFilter]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl">
          <p className="font-medium text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const filters: { id: TimeFilter; label: string }[] = [
    { id: '7days', label: 'Últimos 7 dias' },
    { id: 'thisMonth', label: 'Este Mês' },
    { id: '3months', label: 'Últimos 3 Meses' },
    { id: 'thisYear', label: 'Este Ano' },
  ];

  if (!isPaidPlan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center border border-slate-200">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Análises Avançadas</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            As Análises Avançadas são uma funcionalidade Premium. Tenha acesso a gráficos interativos e descubra para onde seu dinheiro está indo!
          </p>
          <button
            onClick={() => navigate('/plans')}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Ver Planos Premium
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 px-4 mt-3 text-slate-500 hover:text-slate-700 font-medium rounded-xl transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              Análises Avançadas
            </h1>
            <p className="text-slate-500 mt-1 text-sm mb-6">Visão detalhada da sua saúde financeira.</p>
            
            {/* Quick Filters */}
            {!isGeneratingPdf && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setTimeFilter(filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      timeFilter === filter.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isGeneratingPdf && (
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-medium rounded-xl transition-colors shadow-sm text-sm self-start sm:self-auto"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar Relatório (PDF)</span>
            </button>
          )}
        </div>

        {isGeneratingPdf && (
          <div className="flex items-center justify-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-xl animate-pulse">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Montando seu relatório visual...</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-1">
            {/* Chart 1: Daily Evolution */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-slate-900">Evolução de Gastos</h2>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="acumulado" 
                      name="Gasto Acumulado"
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAcumulado)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Radar Categories */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-slate-900">Raio-X de Categorias (Top 5)</h2>
              </div>
              <div className="h-[300px] w-full">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                      <Radar
                        name="Gastos"
                        dataKey="A"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fill="#4f46e5"
                        fillOpacity={0.4}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Dados insuficientes para gerar o gráfico.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 3: Income vs Expense */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-slate-900">Receitas vs Despesas</h2>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

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
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
              Relatório em PDF
            </h3>
            <p className="text-center text-slate-600 mb-6">
              O Relatório Visual em PDF é uma funcionalidade Premium. Tenha o seu histórico financeiro organizado, com gráficos e pronto para impressão!
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
    </div>
  );
}
