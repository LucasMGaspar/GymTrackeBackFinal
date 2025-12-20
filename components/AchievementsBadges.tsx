'use client';

import { useState, useEffect } from 'react';
import type { StudentAchievement, Achievement } from '@/lib/types';

interface Props {
  studentId: string;
  className?: string;
}

export function AchievementsBadges({ studentId, className = '' }: Props) {
  const [achievements, setAchievements] = useState<(StudentAchievement & { achievement: Achievement })[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, [studentId]);

  const fetchAchievements = async () => {
    try {
      // Fetch earned achievements
      const earnedRes = await fetch(`/api/achievements?student_id=${studentId}`);
      if (earnedRes.ok) {
        const data = await earnedRes.json();
        setAchievements(data.achievements || []);
      }

      // Fetch all achievements
      const allRes = await fetch('/api/achievements/all');
      if (allRes.ok) {
        const data = await allRes.json();
        setAllAchievements(data.achievements || []);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const earnedIds = new Set(achievements.map(a => a.achievement.key));
  const displayAchievements = showAll ? allAchievements : allAchievements.slice(0, 6);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Conquistas
          </h3>
          <p className="text-xs text-gray-500">
            {achievements.length} de {allAchievements.length} desbloqueadas
          </p>
        </div>
        {allAchievements.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
          >
            {showAll ? 'Ver menos' : 'Ver todas'}
          </button>
        )}
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">Nenhuma conquista ainda</p>
          <p className="text-xs text-gray-500">Complete treinos para desbloquear badges!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {displayAchievements.map((achievement) => {
              const earned = earnedIds.has(achievement.key);
              const earnedData = achievements.find(a => a.achievement.key === achievement.key);

              return (
                <div
                  key={achievement.id}
                  className={`relative group bg-white border-2 rounded-lg p-3 text-center transition-all duration-200 hover:shadow-md ${
                    earned
                      ? 'border-yellow-300 shadow-sm'
                      : 'border-gray-200 opacity-60'
                  }`}
                  title={achievement.description}
                >
                  {/* Achievement Icon */}
                  <div className={`text-3xl mb-2 ${earned ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>

                  {/* Achievement Name */}
                  <div className={`text-xs font-semibold ${earned ? 'text-gray-900' : 'text-gray-400'}`}>
                    {achievement.name}
                  </div>

                  {/* Earned Badge */}
                  {earned && earnedData && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                      {achievement.description}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Achievement Highlight */}
          {achievements.length > 0 && (
            <div className="mt-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
                  <span className="text-2xl">🎉</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Última conquista</div>
                  <div className="text-sm font-bold text-gray-900">
                    {achievements[achievements.length - 1].achievement.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(achievements[achievements.length - 1].earned_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
