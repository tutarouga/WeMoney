import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { Logo } from './Logo';

interface HeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  spendingFastStreak: number;
}

export function Header({ currentDate, setCurrentDate, spendingFastStreak }: HeaderProps) {
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="w-9 h-9 shadow-sm rounded-xl" />
          <h1 className="text-xl font-semibold text-slate-900 hidden sm:block">Nossas Finanças</h1>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 rounded-full p-1 border border-slate-200">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-white rounded-full transition-colors text-slate-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-sm sm:text-base min-w-[100px] text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-white rounded-full transition-colors text-slate-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full border border-orange-100">
          <Flame className="w-4 h-4 fill-orange-500" />
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-none">{spendingFastStreak} dias</span>
            <span className="text-[10px] leading-none opacity-80 hidden sm:block">sem gastos extras</span>
          </div>
        </div>
      </div>
    </header>
  );
}
