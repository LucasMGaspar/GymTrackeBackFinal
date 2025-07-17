import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Relatório geral de treinos
  async getWorkoutOverview(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const workouts = await this.prisma.workoutExecution.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        ...dateFilter,
      },
      include: {
        exerciseExecutions: {
          include: {
            seriesExecutions: true,
          },
        },
      },
    });

    const totalWorkouts = workouts.length;
    const totalExercises = workouts.reduce(
      (sum, w) => sum + w.exerciseExecutions.length,
      0,
    );
    const totalSeries = workouts.reduce(
      (sum, w) =>
        sum +
        w.exerciseExecutions.reduce(
          (exerciseSum, e) => exerciseSum + e.seriesExecutions.length,
          0,
        ),
      0,
    );

    // Calcular duração média
    const workoutsWithDuration = workouts.filter(
      (w) => w.startTime && w.endTime,
    );
    const avgDuration =
      workoutsWithDuration.length > 0
        ? workoutsWithDuration.reduce((sum, w) => {
            const duration =
              new Date(w.endTime!).getTime() - new Date(w.startTime).getTime();
            return sum + duration / (1000 * 60); // em minutos
          }, 0) / workoutsWithDuration.length
        : 0;

    // Volume total (peso x reps)
    const totalVolume = workouts.reduce(
      (sum, w) =>
        sum +
        w.exerciseExecutions.reduce(
          (exerciseSum, e) =>
            exerciseSum +
            e.seriesExecutions.reduce(
              (seriesSum, s) =>
                seriesSum + parseFloat(s.weight.toString()) * s.reps,
              0,
            ),
          0,
        ),
      0,
    );

    return {
      period: {
        startDate: startDate || 'Início',
        endDate: endDate || 'Hoje',
      },
      totals: {
        workouts: totalWorkouts,
        exercises: totalExercises,
        series: totalSeries,
        volume: Math.round(totalVolume),
      },
      averages: {
        exercisesPerWorkout: totalWorkouts > 0 ? totalExercises / totalWorkouts : 0,
        seriesPerWorkout: totalWorkouts > 0 ? totalSeries / totalWorkouts : 0,
        durationMinutes: Math.round(avgDuration),
      },
      workoutDates: workouts.map((w) => w.date),
    };
  }

  // Progresso por exercício
  async getExerciseProgress(
    userId: string,
    exerciseId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const exerciseExecutions = await this.prisma.exerciseExecution.findMany({
      where: {
        ...(exerciseId && { exerciseId }),
        workoutExecution: {
          userId,
          status: 'COMPLETED',
          ...dateFilter,
        },
      },
      include: {
        exercise: true,
        seriesExecutions: {
          orderBy: { seriesNumber: 'asc' },
        },
        workoutExecution: true,
      },
      orderBy: {
        workoutExecution: {
          date: 'asc',
        },
      },
    });

    // Agrupar por exercício
    const progressByExercise = exerciseExecutions.reduce((acc, ee) => {
      const exerciseName = ee.exerciseName;
      
      if (!acc[exerciseName]) {
        acc[exerciseName] = {
          exerciseId: ee.exerciseId,
          exerciseName,
          sessions: [],
          progress: {
            maxWeight: 0,
            maxReps: 0,
            maxVolume: 0,
            totalSeries: 0,
          },
        };
      }

      const sessionVolume = ee.seriesExecutions.reduce(
        (sum, s) => sum + parseFloat(s.weight.toString()) * s.reps,
        0,
      );

      const maxWeightInSession = Math.max(
        ...ee.seriesExecutions.map((s) => parseFloat(s.weight.toString())),
      );
      const maxRepsInSession = Math.max(
        ...ee.seriesExecutions.map((s) => s.reps),
      );

      acc[exerciseName].sessions.push({
        date: ee.workoutExecution.date,
        series: ee.seriesExecutions.length,
        maxWeight: maxWeightInSession,
        maxReps: maxRepsInSession,
        volume: sessionVolume,
        seriesData: ee.seriesExecutions.map((s) => ({
          weight: parseFloat(s.weight.toString()),
          reps: s.reps,
          difficulty: s.difficulty,
        })),
      });

      // Atualizar recordes
      acc[exerciseName].progress.maxWeight = Math.max(
        acc[exerciseName].progress.maxWeight,
        maxWeightInSession,
      );
      acc[exerciseName].progress.maxReps = Math.max(
        acc[exerciseName].progress.maxReps,
        maxRepsInSession,
      );
      acc[exerciseName].progress.maxVolume = Math.max(
        acc[exerciseName].progress.maxVolume,
        sessionVolume,
      );
      acc[exerciseName].progress.totalSeries += ee.seriesExecutions.length;

      return acc;
    }, {} as any);

    return Object.values(progressByExercise);
  }

  // Frequência de treinos
  async getWorkoutFrequency(
    userId: string,
    period: 'week' | 'month' | 'year',
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const workouts = await this.prisma.workoutExecution.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        ...dateFilter,
      },
      orderBy: { date: 'asc' },
    });

    // Agrupar por período
    const frequency = workouts.reduce((acc, workout) => {
      const date = new Date(workout.date);
      let key: string;

      switch (period) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${Math.ceil(
            (weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          )}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }

      if (!acc[key]) {
        acc[key] = {
          period: key,
          count: 0,
          dates: [],
        };
      }

      acc[key].count++;
      acc[key].dates.push(workout.date);

      return acc;
    }, {} as any);

    return {
      period,
      data: Object.values(frequency),
      summary: {
        total: workouts.length,
        average: Object.values(frequency).length > 0
          ? workouts.length / Object.values(frequency).length
          : 0,
      },
    };
  }

  // Análise por grupo muscular
  async getMuscleGroupAnalysis(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const workouts = await this.prisma.workoutExecution.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        ...dateFilter,
      },
      include: {
        exerciseExecutions: {
          include: {
            seriesExecutions: true,
          },
        },
      },
    });

    const muscleGroupStats = workouts.reduce((acc, workout) => {
      const muscleGroups = workout.muscleGroups as string[];

      muscleGroups.forEach((group) => {
        if (!acc[group]) {
          acc[group] = {
            name: group,
            workouts: 0,
            exercises: 0,
            series: 0,
            volume: 0,
            lastWorkout: null,
          };
        }

        acc[group].workouts++;
        acc[group].exercises += workout.exerciseExecutions.length;
        acc[group].series += workout.exerciseExecutions.reduce(
          (sum, e) => sum + e.seriesExecutions.length,
          0,
        );
        acc[group].volume += workout.exerciseExecutions.reduce(
          (sum, e) =>
            sum +
            e.seriesExecutions.reduce(
              (seriesSum, s) =>
                seriesSum + parseFloat(s.weight.toString()) * s.reps,
              0,
            ),
          0,
        );
        
        if (!acc[group].lastWorkout || workout.date > acc[group].lastWorkout) {
          acc[group].lastWorkout = workout.date;
        }
      });

      return acc;
    }, {} as any);

    return {
      muscleGroups: Object.values(muscleGroupStats),
      total: workouts.length,
    };
  }

  // Análise de volume
  async getVolumeAnalysis(
    userId: string,
    exerciseId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const exerciseExecutions = await this.prisma.exerciseExecution.findMany({
      where: {
        ...(exerciseId && { exerciseId }),
        workoutExecution: {
          userId,
          status: 'COMPLETED',
          ...dateFilter,
        },
      },
      include: {
        seriesExecutions: true,
        workoutExecution: true,
        exercise: true,
      },
      orderBy: {
        workoutExecution: {
          date: 'asc',
        },
      },
    });

    const volumeData = exerciseExecutions.map((ee) => {
      const volume = ee.seriesExecutions.reduce(
        (sum, s) => sum + parseFloat(s.weight.toString()) * s.reps,
        0,
      );

      return {
        date: ee.workoutExecution.date,
        exerciseName: ee.exerciseName,
        volume,
        series: ee.seriesExecutions.length,
        avgWeight: ee.seriesExecutions.reduce(
          (sum, s) => sum + parseFloat(s.weight.toString()),
          0,
        ) / ee.seriesExecutions.length,
        totalReps: ee.seriesExecutions.reduce((sum, s) => sum + s.reps, 0),
      };
    });

    return {
      data: volumeData,
      summary: {
        totalVolume: volumeData.reduce((sum, d) => sum + d.volume, 0),
        averageVolume: volumeData.length > 0
          ? volumeData.reduce((sum, d) => sum + d.volume, 0) / volumeData.length
          : 0,
        maxVolume: Math.max(...volumeData.map((d) => d.volume), 0),
        trend: this.calculateTrend(volumeData.map((d) => d.volume)),
      },
    };
  }

  // Recordes pessoais
  async getPersonalRecords(
    userId: string,
    exerciseId: string | undefined,
    type: 'weight' | 'reps' | 'volume',
  ) {
    const exerciseExecutions = await this.prisma.exerciseExecution.findMany({
      where: {
        ...(exerciseId && { exerciseId }),
        workoutExecution: {
          userId,
          status: 'COMPLETED',
        },
      },
      include: {
        seriesExecutions: true,
        workoutExecution: true,
        exercise: true,
      },
    });

    const records = exerciseExecutions.reduce((acc, ee) => {
      const exerciseName = ee.exerciseName;

      if (!acc[exerciseName]) {
        acc[exerciseName] = {
          exerciseName,
          maxWeight: { value: 0, date: null, reps: 0 },
          maxReps: { value: 0, date: null, weight: 0 },
          maxVolume: { value: 0, date: null },
        };
      }

      ee.seriesExecutions.forEach((series) => {
        const weight = parseFloat(series.weight.toString());
        const reps = series.reps;
        const volume = weight * reps;

        // Recorde de peso
        if (weight > acc[exerciseName].maxWeight.value) {
          acc[exerciseName].maxWeight = {
            value: weight,
            date: ee.workoutExecution.date,
            reps,
          };
        }

        // Recorde de repetições
        if (reps > acc[exerciseName].maxReps.value) {
          acc[exerciseName].maxReps = {
            value: reps,
            date: ee.workoutExecution.date,
            weight,
          };
        }

        // Recorde de volume (por série)
        if (volume > acc[exerciseName].maxVolume.value) {
          acc[exerciseName].maxVolume = {
            value: volume,
            date: ee.workoutExecution.date,
          };
        }
      });

      return acc;
    }, {} as any);

    const result = Object.values(records);

    if (type === 'weight') {
      return result.map((r: any) => ({
        exerciseName: r.exerciseName,
        record: r.maxWeight,
        type: 'Peso máximo',
      }));
    } else if (type === 'reps') {
      return result.map((r: any) => ({
        exerciseName: r.exerciseName,
        record: r.maxReps,
        type: 'Repetições máximas',
      }));
    } else {
      return result.map((r: any) => ({
        exerciseName: r.exerciseName,
        record: r.maxVolume,
        type: 'Volume máximo',
      }));
    }
  }

  // Duração dos treinos
  async getWorkoutDuration(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const workouts = await this.prisma.workoutExecution.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        endTime: { not: null },
        ...dateFilter,
      },
      orderBy: { date: 'asc' },
    });

    const durationData = workouts.map((workout) => {
      const duration =
        (new Date(workout.endTime!).getTime() -
          new Date(workout.startTime).getTime()) /
        (1000 * 60); // em minutos

      return {
        date: workout.date,
        duration: Math.round(duration),
        dayOfWeek: workout.dayOfWeek,
      };
    });

    const avgDuration = durationData.length > 0
      ? durationData.reduce((sum, d) => sum + d.duration, 0) / durationData.length
      : 0;

    return {
      data: durationData,
      summary: {
        average: Math.round(avgDuration),
        shortest: Math.min(...durationData.map((d) => d.duration), 0),
        longest: Math.max(...durationData.map((d) => d.duration), 0),
        total: durationData.reduce((sum, d) => sum + d.duration, 0),
      },
    };
  }

  // Consistência (dias da semana)
  async getWorkoutConsistency(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const workouts = await this.prisma.workoutExecution.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        ...dateFilter,
      },
    });

    const dayStats = workouts.reduce((acc, workout) => {
      const dayOfWeek = workout.dayOfWeek;

      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = 0;
      }

      acc[dayOfWeek]++;

      return acc;
    }, {} as Record<string, number>);

    const daysOfWeek = [
      'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
      'quinta-feira', 'sexta-feira', 'sábado'
    ];

    const consistency = daysOfWeek.map((day) => ({
      dayOfWeek: day,
      count: dayStats[day] || 0,
      percentage: workouts.length > 0 ? ((dayStats[day] || 0) / workouts.length) * 100 : 0,
    }));

    return {
      data: consistency,
      mostActiveDay: consistency.reduce((max, day) => 
        day.count > max.count ? day : max
      ),
      leastActiveDay: consistency.reduce((min, day) => 
        day.count < min.count ? day : min
      ),
    };
  }

  // NOVO: Evolução detalhada de peso e repetições
  async getWeightRepsEvolution(
    userId: string,
    exerciseId: string,
    startDate?: string,
    endDate?: string,
    seriesType: 'max' | 'average' | 'all' = 'max',
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const exerciseExecutions = await this.prisma.exerciseExecution.findMany({
      where: {
        exerciseId,
        workoutExecution: {
          userId,
          status: 'COMPLETED',
          ...dateFilter,
        },
      },
      include: {
        exercise: true,
        seriesExecutions: {
          orderBy: { seriesNumber: 'asc' },
        },
        workoutExecution: true,
      },
      orderBy: {
        workoutExecution: {
          date: 'asc',
        },
      },
    });

    if (exerciseExecutions.length === 0) {
      return {
        exerciseName: 'Exercício não encontrado',
        data: [],
        analysis: null,
      };
    }

    const exerciseName = exerciseExecutions[0].exerciseName;

    // Processar dados por sessão
    const evolutionData = exerciseExecutions.map((ee) => {
      const series = ee.seriesExecutions;
      
      let processedSeries;
      switch (seriesType) {
        case 'max':
          const maxWeight = Math.max(...series.map(s => parseFloat(s.weight.toString())));
          const maxReps = Math.max(...series.map(s => s.reps));
          const maxWeightSeries = series.find(s => parseFloat(s.weight.toString()) === maxWeight);
          const maxRepsSeries = series.find(s => s.reps === maxReps);
          
          processedSeries = {
            maxWeight: {
              weight: maxWeight,
              reps: maxWeightSeries?.reps || 0,
              volume: maxWeight * (maxWeightSeries?.reps || 0),
            },
            maxReps: {
              weight: parseFloat(maxRepsSeries?.weight.toString() || '0'),
              reps: maxReps,
              volume: parseFloat(maxRepsSeries?.weight.toString() || '0') * maxReps,
            },
            bestVolume: {
              weight: 0,
              reps: 0,
              volume: Math.max(...series.map(s => parseFloat(s.weight.toString()) * s.reps)),
            }
          };
          
          // Encontrar a série com melhor volume
          const bestVolumeSeries = series.reduce((best, current) => {
            const currentVolume = parseFloat(current.weight.toString()) * current.reps;
            const bestVolume = parseFloat(best.weight.toString()) * best.reps;
            return currentVolume > bestVolume ? current : best;
          });
          
          processedSeries.bestVolume.weight = parseFloat(bestVolumeSeries.weight.toString());
          processedSeries.bestVolume.reps = bestVolumeSeries.reps;
          break;

        case 'average':
          const avgWeight = series.reduce((sum, s) => sum + parseFloat(s.weight.toString()), 0) / series.length;
          const avgReps = series.reduce((sum, s) => sum + s.reps, 0) / series.length;
          
          processedSeries = {
            averageWeight: avgWeight,
            averageReps: avgReps,
            averageVolume: avgWeight * avgReps,
            totalSeries: series.length,
          };
          break;

        case 'all':
          processedSeries = {
            allSeries: series.map((s, index) => ({
              seriesNumber: index + 1,
              weight: parseFloat(s.weight.toString()),
              reps: s.reps,
              volume: parseFloat(s.weight.toString()) * s.reps,
              difficulty: s.difficulty,
              restTime: s.restTime,
              notes: s.notes,
            })),
            summary: {
              totalSeries: series.length,
              totalVolume: series.reduce((sum, s) => sum + parseFloat(s.weight.toString()) * s.reps, 0),
              averageWeight: series.reduce((sum, s) => sum + parseFloat(s.weight.toString()), 0) / series.length,
              averageReps: series.reduce((sum, s) => sum + s.reps, 0) / series.length,
            }
          };
          break;
      }

      return {
        date: ee.workoutExecution.date,
        dayOfWeek: ee.workoutExecution.dayOfWeek,
        workoutId: ee.workoutExecution.id,
        ...processedSeries,
      };
    });

    // Análise de progresso
    const analysis = this.analyzeEvolution(evolutionData, seriesType);

    return {
      exerciseName,
      exerciseId,
      seriesType,
      period: {
        startDate: startDate || evolutionData[0]?.date || 'N/A',
        endDate: endDate || evolutionData[evolutionData.length - 1]?.date || 'N/A',
        totalSessions: evolutionData.length,
      },
      data: evolutionData,
      analysis,
    };
  }

  // NOVO: Comparar múltiplos exercícios
  async compareExercises(
    userId: string,
    exerciseIds: string[],
    metric: 'weight' | 'reps' | 'volume',
    startDate?: string,
    endDate?: string,
  ) {
    const comparisons = await Promise.all(
      exerciseIds.map(async (exerciseId) => {
        const evolution = await this.getWeightRepsEvolution(
          userId,
          exerciseId,
          startDate,
          endDate,
          'max'
        );
        
        return {
          exerciseId,
          exerciseName: evolution.exerciseName,
          totalSessions: evolution.period?.totalSessions || 0,
          latestData: evolution.data[evolution.data.length - 1],
          firstData: evolution.data[0],
          improvement: this.calculateImprovement(evolution.data, metric),
        };
      })
    );

    return {
      metric,
      period: {
        startDate: startDate || 'Início',
        endDate: endDate || 'Hoje',
      },
      exercises: comparisons,
      ranking: comparisons
        .sort((a, b) => (b.improvement.percentage || 0) - (a.improvement.percentage || 0))
        .map((ex, index) => ({
          position: index + 1,
          exerciseName: ex.exerciseName,
          improvement: ex.improvement,
        })),
    };
  }

  // NOVO: Análise de força (1RM estimado e curva força-repetições)
  async getStrengthAnalysis(
    userId: string,
    exerciseId: string | undefined,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const exerciseExecutions = await this.prisma.exerciseExecution.findMany({
      where: {
        ...(exerciseId && { exerciseId }),
        workoutExecution: {
          userId,
          status: 'COMPLETED',
          ...dateFilter,
        },
      },
      include: {
        exercise: true,
        seriesExecutions: true,
        workoutExecution: true,
      },
    });

    const strengthData = exerciseExecutions.reduce((acc, ee) => {
      const exerciseName = ee.exerciseName;
      
      if (!acc[exerciseName]) {
        acc[exerciseName] = {
          exerciseName,
          exerciseId: ee.exerciseId,
          strengthCurve: [], // Array de { reps, weight, estimated1RM, date }
          records: {
            heaviest1Rep: null,
            heaviest5Reps: null,
            heaviest10Reps: null,
            estimated1RM: null,
          },
        };
      }

      ee.seriesExecutions.forEach((series) => {
        const weight = parseFloat(series.weight.toString());
        const reps = series.reps;
        
        // Fórmula de Brzycki para estimar 1RM
        const estimated1RM = reps === 1 ? weight : weight * (36 / (37 - reps));
        
        acc[exerciseName].strengthCurve.push({
          date: ee.workoutExecution.date,
          weight,
          reps,
          estimated1RM: Math.round(estimated1RM * 100) / 100,
          volume: weight * reps,
        });

        // Atualizar recordes
        const records = acc[exerciseName].records;
        
        if (reps === 1 && (!records.heaviest1Rep || weight > records.heaviest1Rep.weight)) {
          records.heaviest1Rep = { weight, date: ee.workoutExecution.date };
        }
        
        if (reps >= 5 && (!records.heaviest5Reps || weight > records.heaviest5Reps.weight)) {
          records.heaviest5Reps = { weight, reps, date: ee.workoutExecution.date };
        }
        
        if (reps >= 10 && (!records.heaviest10Reps || weight > records.heaviest10Reps.weight)) {
          records.heaviest10Reps = { weight, reps, date: ee.workoutExecution.date };
        }
        
        if (!records.estimated1RM || estimated1RM > records.estimated1RM.value) {
          records.estimated1RM = { 
            value: Math.round(estimated1RM * 100) / 100, 
            basedOn: `${weight}kg x ${reps} reps`,
            date: ee.workoutExecution.date 
          };
        }
      });

      return acc;
    }, {} as any);

    return {
      exercises: Object.values(strengthData),
      summary: {
        totalExercises: Object.keys(strengthData).length,
        overallStrengthTrend: this.calculateOverallStrengthTrend(Object.values(strengthData)),
      },
    };
  }

  // Relatório completo
  async getCompleteReport(
    userId: string,
    format: 'json' | 'summary',
    startDate?: string,
    endDate?: string,
  ) {
    const [
      overview,
      exerciseProgress,
      frequency,
      muscleGroups,
      volume,
      records,
      duration,
      consistency,
    ] = await Promise.all([
      this.getWorkoutOverview(userId, startDate, endDate),
      this.getExerciseProgress(userId, undefined, startDate, endDate),
      this.getWorkoutFrequency(userId, 'month', startDate, endDate),
      this.getMuscleGroupAnalysis(userId, startDate, endDate),
      this.getVolumeAnalysis(userId, undefined, startDate, endDate),
      this.getPersonalRecords(userId, undefined, 'weight'),
      this.getWorkoutDuration(userId, startDate, endDate),
      this.getWorkoutConsistency(userId, startDate, endDate),
    ]);

    if (format === 'summary') {
      return {
        period: overview.period,
        summary: {
          totalWorkouts: overview.totals.workouts,
          totalVolume: overview.totals.volume,
          averageDuration: duration.summary.average,
          mostActiveDay: consistency.mostActiveDay.dayOfWeek,
          topMuscleGroup: muscleGroups.muscleGroups.length > 0
            ? (muscleGroups.muscleGroups as any[]).reduce((max: any, group: any) => 
                group.workouts > max.workouts ? group : max
              ).name
            : 'Nenhum',
          currentStreak: this.calculateCurrentStreak(
            overview.workoutDates.map((date) => new Date(date))
          ),
        },
        highlights: {
          personalRecords: records.slice(0, 5),
          volumeTrend: volume.summary.trend,
          consistencyScore: consistency.data.reduce(
            (sum, day) => sum + (day.count > 0 ? 1 : 0), 0
          ) / 7 * 100,
        },
      };
    }

    return {
      overview,
      exerciseProgress,
      frequency,
      muscleGroups,
      volume,
      records,
      duration,
      consistency,
      generatedAt: new Date(),
    };
  }

  // Métodos auxiliares
  private buildDateFilter(startDate?: string, endDate?: string) {
    const filter: any = {};

    if (startDate) {
      filter.date = { ...filter.date, gte: new Date(startDate) };
    }

    if (endDate) {
      filter.date = { ...filter.date, lte: new Date(endDate) };
    }

    return Object.keys(filter).length > 0 ? filter : {};
  }

  private analyzeEvolution(data: any[], seriesType: string) {
    if (data.length < 2) {
      return {
        trend: 'insufficient_data',
        message: 'Precisa de pelo menos 2 sessões para análise',
      };
    }

    const first = data[0];
    const last = data[data.length - 1];
    
    if (seriesType === 'max') {
      const weightImprovement = last.maxWeight.weight - first.maxWeight.weight;
      const repsImprovement = last.maxReps.reps - first.maxReps.reps;
      const volumeImprovement = last.bestVolume.volume - first.bestVolume.volume;
      
      return {
        weightProgress: {
          initial: first.maxWeight.weight,
          current: last.maxWeight.weight,
          difference: weightImprovement,
          percentage: (weightImprovement / first.maxWeight.weight) * 100,
        },
        repsProgress: {
          initial: first.maxReps.reps,
          current: last.maxReps.reps,
          difference: repsImprovement,
          percentage: (repsImprovement / first.maxReps.reps) * 100,
        },
        volumeProgress: {
          initial: first.bestVolume.volume,
          current: last.bestVolume.volume,
          difference: volumeImprovement,
          percentage: (volumeImprovement / first.bestVolume.volume) * 100,
        },
        overallTrend: this.determineOverallTrend(weightImprovement, repsImprovement, volumeImprovement),
        sessionsAnalyzed: data.length,
      };
    }

    return { message: 'Análise disponível apenas para seriesType: max' };
  }

  private calculateImprovement(data: any[], metric: string) {
    if (data.length < 2) return { difference: 0, percentage: 0 };

    const first = data[0];
    const last = data[data.length - 1];
    
    let initialValue, currentValue;

    switch (metric) {
      case 'weight':
        initialValue = first.maxWeight?.weight || 0;
        currentValue = last.maxWeight?.weight || 0;
        break;
      case 'reps':
        initialValue = first.maxReps?.reps || 0;
        currentValue = last.maxReps?.reps || 0;
        break;
      case 'volume':
        initialValue = first.bestVolume?.volume || 0;
        currentValue = last.bestVolume?.volume || 0;
        break;
      default:
        return { difference: 0, percentage: 0 };
    }

    const difference = currentValue - initialValue;
    const percentage = initialValue > 0 ? (difference / initialValue) * 100 : 0;

    return { 
      difference: Math.round(difference * 100) / 100, 
      percentage: Math.round(percentage * 100) / 100,
      initialValue,
      currentValue,
    };
  }

  private calculateOverallStrengthTrend(exercises: any[]) {
    if (exercises.length === 0) return 'no_data';

    const trends = exercises.map(exercise => {
      const curve = exercise.strengthCurve;
      if (curve.length < 2) return 0;

      const first = curve[0];
      const last = curve[curve.length - 1];
      return last.estimated1RM - first.estimated1RM;
    });

    const avgTrend = trends.reduce((sum, trend) => sum + trend, 0) / trends.length;
    
    if (avgTrend > 5) return 'strong_improvement';
    if (avgTrend > 0) return 'improvement';
    if (avgTrend > -5) return 'stable';
    return 'decline';
  }

  private determineOverallTrend(weightDiff: number, repsDiff: number, volumeDiff: number) {
    const improvements = [weightDiff > 0, repsDiff > 0, volumeDiff > 0].filter(Boolean).length;
    
    if (improvements >= 2) return 'improving';
    if (improvements === 1) return 'mixed';
    return 'declining';
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const diff = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  }

  private calculateCurrentStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    const sortedDates = dates.sort((a, b) => b.getTime() - a.getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = today;

    for (const workoutDate of sortedDates) {
      const workout = new Date(workoutDate);
      workout.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - workout.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0 || diffDays === 1) {
        streak++;
        currentDate = workout;
      } else {
        break;
      }
    }

    return streak;
  }
}