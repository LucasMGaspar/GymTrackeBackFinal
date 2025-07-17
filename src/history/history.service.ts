import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

interface HistoryFilters {
  page: number;
  limit: number;
  status?: string; // Simplificado para aceitar qualquer string
  startDate?: string;
  endDate?: string;
  muscleGroup?: string;
  search?: string;
}

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  // Listar histórico de treinos com filtros e paginação
  async getWorkoutHistory(userId: string, filters: HistoryFilters) {
    const { page, limit, status, startDate, endDate, search } = filters;
    const skip = (page - 1) * limit;

    // Construir filtros dinâmicos
    const where: any = {
      userId,
    };

    // Validar e aplicar filtro de status
    if (status && status.trim() !== '' && ['COMPLETED', 'CANCELLED', 'IN_PROGRESS'].includes(status)) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = { gte: new Date(startDate) };
    } else if (endDate) {
      where.date = { lte: new Date(endDate) };
    }

    // Buscar treinos
    const [workouts, total] = await Promise.all([
      this.prisma.workoutExecution.findMany({
        where,
        include: {
          exerciseExecutions: {
            include: {
              exercise: true,
              seriesExecutions: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.workoutExecution.count({ where }),
    ]);

    // Aplicar filtro de busca textual se necessário
    let filteredWorkouts = workouts;
    if (search) {
      filteredWorkouts = workouts.filter((workout) => {
        const searchLower = search.toLowerCase();
        
        // Buscar em exercícios
        const hasExerciseMatch = workout.exerciseExecutions.some((ee) =>
          ee.exerciseName.toLowerCase().includes(searchLower)
        );
        
        // Buscar em notas
        const hasNotesMatch = workout.notes?.toLowerCase().includes(searchLower);
        
        // Buscar em grupos musculares
        const muscleGroups = Array.isArray(workout.muscleGroups) ? 
          workout.muscleGroups as string[] : [];
        const hasMuscleGroupMatch = muscleGroups.some((mg: string) => 
          mg.toLowerCase().includes(searchLower)
        );
        
        return hasExerciseMatch || hasNotesMatch || hasMuscleGroupMatch;
      });
    }

    // Calcular estatísticas para cada treino
    const workoutsWithStats = filteredWorkouts.map((workout) => {
      const totalExercises = workout.exerciseExecutions.length;
      const completedExercises = workout.exerciseExecutions.filter(ee => ee.isCompleted).length;
      const totalSeries = workout.exerciseExecutions.reduce(
        (sum, ee) => sum + ee.seriesExecutions.length,
        0
      );
      const totalVolume = workout.exerciseExecutions.reduce(
        (sum, ee) => sum + ee.seriesExecutions.reduce(
          (seriesSum, se) => seriesSum + (parseFloat(se.weight.toString()) * se.reps),
          0
        ),
        0
      );

      let duration = 0;
      if (workout.startTime && workout.endTime) {
        duration = Math.round(
          (new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / (1000 * 60)
        );
      }

      return {
        ...workout,
        stats: {
          totalExercises,
          completedExercises,
          totalSeries,
          totalVolume: Math.round(totalVolume),
          duration,
          completionRate: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
        },
      };
    });

    return {
      data: workoutsWithStats,
      pagination: {
        page,
        limit,
        total: search ? filteredWorkouts.length : total,
        totalPages: Math.ceil((search ? filteredWorkouts.length : total) / limit),
        hasNext: page * limit < (search ? filteredWorkouts.length : total),
        hasPrev: page > 1,
      },
    };
  }

  // Obter detalhes completos de um treino
  async getWorkoutDetails(userId: string, workoutId: string) {
    const workout = await this.prisma.workoutExecution.findFirst({
      where: { id: workoutId, userId },
      include: {
        exerciseExecutions: {
          include: {
            exercise: true,
            seriesExecutions: {
              orderBy: { seriesNumber: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!workout) {
      throw new NotFoundException('Treino não encontrado');
    }

    // Calcular estatísticas detalhadas
    const stats = {
      totalExercises: workout.exerciseExecutions.length,
      completedExercises: workout.exerciseExecutions.filter(ee => ee.isCompleted).length,
      totalSeries: workout.exerciseExecutions.reduce(
        (sum, ee) => sum + ee.seriesExecutions.length,
        0
      ),
      totalVolume: workout.exerciseExecutions.reduce(
        (sum, ee) => sum + ee.seriesExecutions.reduce(
          (seriesSum, se) => seriesSum + (parseFloat(se.weight.toString()) * se.reps),
          0
        ),
        0
      ),
      averageWeight: 0,
      averageReps: 0,
      duration: 0,
    };

    // Calcular médias
    const allSeries = workout.exerciseExecutions.flatMap(ee => ee.seriesExecutions);
    if (allSeries.length > 0) {
      stats.averageWeight = allSeries.reduce(
        (sum, se) => sum + parseFloat(se.weight.toString()),
        0
      ) / allSeries.length;
      stats.averageReps = allSeries.reduce(
        (sum, se) => sum + se.reps,
        0
      ) / allSeries.length;
    }

    // Calcular duração
    if (workout.startTime && workout.endTime) {
      stats.duration = Math.round(
        (new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / (1000 * 60)
      );
    }

    return {
      ...workout,
      stats: {
        ...stats,
        totalVolume: Math.round(stats.totalVolume),
        averageWeight: Math.round(stats.averageWeight * 100) / 100,
        averageReps: Math.round(stats.averageReps * 100) / 100,
      },
    };
  }

  // Estatísticas do histórico
  async getHistoryStats(userId: string, period: string, startDate?: string, endDate?: string) {
    let dateFilter: any = {};

    // Definir período
    const now = new Date();
    switch (period) {
      case 'week':
        dateFilter.gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFilter.gte = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        if (startDate && endDate) {
          dateFilter = {
            gte: new Date(startDate),
            lte: new Date(endDate),
          };
        }
    }

    const where: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }

    const workouts = await this.prisma.workoutExecution.findMany({
      where,
      include: {
        exerciseExecutions: {
          include: {
            seriesExecutions: true,
          },
        },
      },
    });

    const completedWorkouts = workouts.filter(w => w.status === 'COMPLETED');
    const cancelledWorkouts = workouts.filter(w => w.status === 'CANCELLED');
    const inProgressWorkouts = workouts.filter(w => w.status === 'IN_PROGRESS');

    // Calcular estatísticas
    const totalVolume = completedWorkouts.reduce(
      (sum, workout) => sum + workout.exerciseExecutions.reduce(
        (workoutSum, ee) => workoutSum + ee.seriesExecutions.reduce(
          (seriesSum, se) => seriesSum + (parseFloat(se.weight.toString()) * se.reps),
          0
        ),
        0
      ),
      0
    );

    const totalSeries = completedWorkouts.reduce(
      (sum, workout) => sum + workout.exerciseExecutions.reduce(
        (workoutSum, ee) => workoutSum + ee.seriesExecutions.length,
        0
      ),
      0
    );

    const totalExercises = completedWorkouts.reduce(
      (sum, workout) => sum + workout.exerciseExecutions.length,
      0
    );

    // Duração total
    const totalDuration = completedWorkouts.reduce((sum, workout) => {
      if (workout.startTime && workout.endTime) {
        return sum + (new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / (1000 * 60);
      }
      return sum;
    }, 0);

    return {
      period,
      totals: {
        workouts: workouts.length,
        completedWorkouts: completedWorkouts.length,
        cancelledWorkouts: cancelledWorkouts.length,
        inProgressWorkouts: inProgressWorkouts.length,
        exercises: totalExercises,
        series: totalSeries,
        volume: Math.round(totalVolume),
        duration: Math.round(totalDuration),
      },
      averages: {
        workoutsPerWeek: period === 'week' ? completedWorkouts.length : completedWorkouts.length / 4,
        exercisesPerWorkout: completedWorkouts.length > 0 ? totalExercises / completedWorkouts.length : 0,
        seriesPerWorkout: completedWorkouts.length > 0 ? totalSeries / completedWorkouts.length : 0,
        volumePerWorkout: completedWorkouts.length > 0 ? totalVolume / completedWorkouts.length : 0,
        durationPerWorkout: completedWorkouts.length > 0 ? totalDuration / completedWorkouts.length : 0,
      },
      completionRate: workouts.length > 0 ? (completedWorkouts.length / workouts.length) * 100 : 0,
    };
  }

  // Padrão semanal de treinos
  async getWeeklyPattern(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId, status: 'COMPLETED' };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const workouts = await this.prisma.workoutExecution.findMany({ where });

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

    return daysOfWeek.map(day => ({
      dayOfWeek: day,
      count: dayStats[day] || 0,
      percentage: workouts.length > 0 ? ((dayStats[day] || 0) / workouts.length) * 100 : 0,
    }));
  }

  // Estatísticas de grupos musculares
  async getMuscleGroupStats(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId, status: 'COMPLETED' };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const workouts = await this.prisma.workoutExecution.findMany({ where });

    const muscleGroupStats: Record<string, { name: string; count: number; percentage: number }> = {};

    workouts.forEach(workout => {
      const muscleGroups = Array.isArray(workout.muscleGroups) ? 
        workout.muscleGroups as string[] : [];
      
      muscleGroups.forEach((group: string) => {
        const groupName = String(group); // Garantir que é string
        if (!muscleGroupStats[groupName]) {
          muscleGroupStats[groupName] = {
            name: groupName,
            count: 0,
            percentage: 0,
          };
        }
        muscleGroupStats[groupName].count++;
      });
    });

    // Calcular percentuais
    const totalWorkouts = workouts.length;
    Object.values(muscleGroupStats).forEach(stat => {
      stat.percentage = totalWorkouts > 0 ? (stat.count / totalWorkouts) * 100 : 0;
    });

    return Object.values(muscleGroupStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }

  // Deletar treino
  async deleteWorkout(userId: string, workoutId: string) {
    const workout = await this.prisma.workoutExecution.findFirst({
      where: { id: workoutId, userId },
    });

    if (!workout) {
      throw new NotFoundException('Treino não encontrado');
    }

    if (workout.status === 'IN_PROGRESS') {
      throw new BadRequestException('Não é possível deletar um treino em andamento');
    }

    await this.prisma.workoutExecution.delete({
      where: { id: workoutId },
    });

    return { message: 'Treino deletado com sucesso' };
  }

  // Duplicar treino - VERSÃO CORRIGIDA
  async duplicateWorkout(userId: string, workoutId: string) {
    const originalWorkout = await this.prisma.workoutExecution.findFirst({
      where: { id: workoutId, userId },
      include: {
        exerciseExecutions: {
          include: {
            seriesExecutions: true,
          },
        },
      },
    });

    if (!originalWorkout) {
      throw new NotFoundException('Treino não encontrado');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se já tem treino hoje
    const existingWorkout = await this.prisma.workoutExecution.findFirst({
      where: { userId, date: today },
    });

    if (existingWorkout) {
      throw new BadRequestException('Já existe um treino para hoje');
    }

    const dayOfWeek = today.toLocaleDateString('pt-BR', { weekday: 'long' });

    // Processar muscleGroups corretamente para o tipo do Prisma
    let muscleGroupsData: Prisma.InputJsonValue = [];
    
    if (originalWorkout.muscleGroups) {
      if (Array.isArray(originalWorkout.muscleGroups)) {
        muscleGroupsData = originalWorkout.muscleGroups;
      }
    }

    // Criar novo treino baseado no original
    const newWorkout = await this.prisma.workoutExecution.create({
      data: {
        userId,
        date: today,
        dayOfWeek,
        muscleGroups: muscleGroupsData,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        notes: `Baseado no treino de ${new Date(originalWorkout.date).toLocaleDateString('pt-BR')}`,
      },
    });

    return {
      id: newWorkout.id,
      message: 'Treino duplicado com sucesso',
      newWorkout,
    };
  }
}