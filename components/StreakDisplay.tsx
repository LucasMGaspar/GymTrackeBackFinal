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
    <div className={`relative ${className}`}>
      {/* Main Streak Card */}
      <div className={`relative overflow-hidden rounded-2xl p-6 ${
        active 
          ? 'bg-gradient-to-br from-orange-500 to-red-500' 
          : 'bg-gradient-to-br from-gray-400 to-gray-500'
      }`}>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white text-sm font-bold opacity-90 uppercase tracking-wide">
                {active ? '🔥 Sequência Ativa' : '💤 Sequência Quebrada'}
              </h3>
            </div>
            {currentStreak >= 3 && active && (
              <div className="animate-pulse">
                <span className="text-4xl">🔥</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Current Streak */}
            <div className="text-center bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-5xl font-black text-white mb-1">
                {currentStreak}
              </div>
              <div className="text-xs text-white opacity-90 font-semibold uppercase tracking-wide">
                Dias Seguidos
              </div>
            </div>

            {/* Longest Streak */}
            <div className="text-center bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-5xl font-black text-white mb-1">
                {longestStreak}
              </div>
              <div className="text-xs text-white opacity-90 font-semibold uppercase tracking-wide">
                Recorde
              </div>
            </div>
          </div>

          {/* Motivation Message */}
          <div className="mt-4 text-center">
            {active && currentStreak > 0 && (
              <p className="text-white text-sm font-semibold">
                {currentStreak === 1 && "Bom começo! Continue assim! 💪"}
                {currentStreak >= 2 && currentStreak < 7 && "Você está no caminho certo! 🚀"}
                {currentStreak >= 7 && currentStreak < 14 && "Impressionante! Continue firme! ⚡"}
                {currentStreak >= 14 && currentStreak < 30 && "Você é uma máquina! 🏆"}
                {currentStreak >= 30 && "LENDÁRIO! Nada te para! 👑"}
              </p>
            )}
            {!active && lastWorkoutDate && (
              <p className="text-white text-sm font-semibold">
                Que tal recomeçar hoje? 🎯
              </p>
            )}
            {!lastWorkoutDate && (
              <p className="text-white text-sm font-semibold">
                Complete seu primeiro treino! 🌟
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      {active && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-gray-700">
              Próxima conquista:
            </span>
            <span className="font-bold text-indigo-600">
              {currentStreak < 3 && `${3 - currentStreak} dia${3 - currentStreak > 1 ? 's' : ''} 🔥`}
              {currentStreak >= 3 && currentStreak < 7 && `${7 - currentStreak} dia${7 - currentStreak > 1 ? 's' : ''} 💪`}
              {currentStreak >= 7 && currentStreak < 14 && `${14 - currentStreak} dia${14 - currentStreak > 1 ? 's' : ''} ⚡`}
              {currentStreak >= 14 && currentStreak < 30 && `${30 - currentStreak} dia${30 - currentStreak > 1 ? 's' : ''} 👑`}
              {currentStreak >= 30 && 'Máximo! 🎖️'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
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
  );
}
