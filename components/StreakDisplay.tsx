'use client';

interface Props {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  className?: string;
}

export function StreakDisplay({ currentStreak, longestStreak, lastWorkoutDate, className = '' }: Props) {
  const isStreakActive = () => {
    if (!lastWorkoutDate) return false;
    const last = new Date(lastWorkoutDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 1; // Active if workout was today or yesterday
  };

  const active = isStreakActive();

  return (
    <div className={`${className}`}>
      {/* Main Streak Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              active ? 'bg-primary-100' : 'bg-gray-100'
            }`}>
              <span className="text-lg">{active ? '🔥' : '💤'}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {active ? 'Sequência Ativa' : 'Sequência Quebrada'}
              </h3>
              <p className="text-xs text-gray-500">Acompanhe seu progresso</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Current Streak */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {currentStreak}
              </div>
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Dias Seguidos
              </div>
            </div>

            {/* Longest Streak */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {longestStreak}
              </div>
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Recorde
              </div>
            </div>
          </div>

          {/* Motivation Message */}
          {active && currentStreak > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-sm text-gray-700 text-center font-medium">
                {currentStreak === 1 && "Bom começo! Continue assim! 💪"}
                {currentStreak >= 2 && currentStreak < 7 && "Você está no caminho certo! 🚀"}
                {currentStreak >= 7 && currentStreak < 14 && "Impressionante! Continue firme! ⚡"}
                {currentStreak >= 14 && currentStreak < 30 && "Você é uma máquina! 🏆"}
                {currentStreak >= 30 && "Lendário! Nada te para! 👑"}
              </p>
            </div>
          )}
        </div>

        {/* Progress to Next Milestone */}
        {active && (
          <div className="bg-gray-50 border-t border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-600">
                Próxima conquista
              </span>
              <span className="text-xs font-semibold text-primary-600">
                {currentStreak < 3 && `${3 - currentStreak} dia${3 - currentStreak > 1 ? 's' : ''}`}
                {currentStreak >= 3 && currentStreak < 7 && `${7 - currentStreak} dia${7 - currentStreak > 1 ? 's' : ''}`}
                {currentStreak >= 7 && currentStreak < 14 && `${14 - currentStreak} dia${14 - currentStreak > 1 ? 's' : ''}`}
                {currentStreak >= 14 && currentStreak < 30 && `${30 - currentStreak} dia${30 - currentStreak > 1 ? 's' : ''}`}
                {currentStreak >= 30 && 'Máximo!'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary-500 h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${
                    currentStreak < 3 ? (currentStreak / 3) * 100 :
                    currentStreak < 7 ? ((currentStreak - 3) / 4) * 100 :
                    currentStreak < 14 ? ((currentStreak - 7) / 7) * 100 :
                    currentStreak < 30 ? ((currentStreak - 14) / 16) * 100 :
                    100
                  }%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
