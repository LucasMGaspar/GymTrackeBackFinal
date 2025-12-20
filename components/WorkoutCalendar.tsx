'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkoutSession {
  id: string;
  session_date: string;
  status: 'in_progress' | 'completed';
  completed_at: string | null;
  template_name: string | null;
  duration_minutes: number | null;
}

interface WorkoutCalendarProps {
  studentId?: string; // For personal trainers viewing a student's calendar
  initialYear?: number;
  initialMonth?: number;
}

export function WorkoutCalendar({ studentId, initialYear, initialMonth }: WorkoutCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const date = new Date();
    if (initialYear) date.setFullYear(initialYear);
    if (initialMonth) date.setMonth(initialMonth - 1);
    return date;
  });

  const [sessionsByDate, setSessionsByDate] = useState<Record<string, WorkoutSession[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    fetchSessions(year, month);
  }, [year, month, studentId]);

  const fetchSessions = async (year: number, month: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString(),
      });

      if (studentId) {
        params.append('studentId', studentId);
      }

      const response = await fetch(`/api/workouts/calendar?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }

      setSessionsByDate(data.sessionsByDate || {});
    } catch (err: any) {
      console.error('Error fetching calendar sessions:', err);
      setError(err.message || 'Erro ao carregar calendário');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get all days in the month view (including padding days from previous/next month)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday = 0
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const getDaySessions = (day: Date): WorkoutSession[] => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return sessionsByDate[dateStr] || [];
  };

  const getCompletedCount = (day: Date): number => {
    return getDaySessions(day).filter((s) => s.status === 'completed').length;
  };

  const getInProgressCount = (day: Date): number => {
    return getDaySessions(day).filter((s) => s.status === 'in_progress').length;
  };

  const isToday = (day: Date): boolean => {
    return isSameDay(day, today);
  };

  const isCurrentMonth = (day: Date): boolean => {
    return isSameMonth(day, currentDate);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-1 hover:bg-primary-400 rounded-lg transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-1 hover:bg-primary-400 rounded-lg transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
        >
          Hoje
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const completedCount = getCompletedCount(day);
            const inProgressCount = getInProgressCount(day);
            const hasSessions = completedCount > 0 || inProgressCount > 0;
            const dayIsToday = isToday(day);
            const dayIsCurrentMonth = isCurrentMonth(day);

            return (
              <div
                key={index}
                className={`
                  aspect-square p-1 rounded-lg border-2 transition-all
                  ${dayIsCurrentMonth ? 'border-gray-200' : 'border-gray-100'}
                  ${dayIsToday ? 'border-primary-500 bg-primary-50' : ''}
                  ${hasSessions && dayIsCurrentMonth ? 'bg-green-50 border-green-200' : ''}
                  ${!dayIsCurrentMonth ? 'opacity-40' : ''}
                  flex flex-col items-center justify-start
                  hover:shadow-md transition-shadow cursor-pointer
                `}
              >
                {/* Day number */}
                <div
                  className={`
                    text-sm font-medium mb-1
                    ${dayIsToday ? 'text-primary-600 font-bold' : ''}
                    ${!dayIsCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                  `}
                >
                  {format(day, 'd')}
                </div>

                {/* Session indicators */}
                {hasSessions && dayIsCurrentMonth && (
                  <div className="flex flex-col items-center gap-0.5 w-full">
                    {completedCount > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        {completedCount > 1 && (
                          <span className="text-xs text-green-600 font-medium">{completedCount}</span>
                        )}
                      </div>
                    )}
                    {inProgressCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-500" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-500 bg-primary-50 rounded"></div>
            <span className="text-gray-600">Hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">Treino completo</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-gray-600">Em progresso</span>
          </div>
        </div>
      </div>
    </div>
  );
}

