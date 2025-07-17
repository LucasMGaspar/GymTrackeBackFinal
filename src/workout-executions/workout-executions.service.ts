/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { SelectExercisesDto } from './dto/select-exercises.dto';
import { RegisterSeriesDto } from './dto/register-series.dto';

@Injectable()
export class WorkoutExecutionsService {
  constructor(private prisma: PrismaService) {}

  // 1. Iniciar novo treino
  async startWorkout(userId: string, dto: StartWorkoutDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se já tem treino hoje
    const existingWorkout = await this.prisma.workoutExecution.findFirst({
      where: {
        userId,
        date: today,
      },
    });

    if (existingWorkout) {
      throw new BadRequestException('Já existe um treino para hoje');
    }

    const dayOfWeek = today.toLocaleDateString('pt-BR', { weekday: 'long' });

    return this.prisma.workoutExecution.create({
      data: {
        userId,
        date: today,
        dayOfWeek,
        muscleGroups: dto.muscleGroups,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        notes: dto.notes,
      },
    });
  }

  // 2. Obter exercícios disponíveis por grupo muscular
  async getAvailableExercises(userId: string, workoutId: string) {
    const workout = await this.prisma.workoutExecution.findFirst({
      where: { id: workoutId, userId },
    });

    if (!workout) {
      throw new NotFoundException('Treino não encontrado');
    }

    const muscleGroups = workout.muscleGroups as string[];

    // Buscar exercícios que contenham pelo menos um dos grupos musculares
    const exercises = await this.prisma.exercise.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return exercises.filter((exercise) => {
      const exerciseMuscleGroups = exercise.muscleGroups as string[];
      return muscleGroups.some((group) => exerciseMuscleGroups.includes(group));
    });
  }

  // 3. Selecionar exercícios para o treino
  async selectExercises(
    userId: string,
    workoutId: string,
    dto: SelectExercisesDto,
  ) {
    const workout = await this.prisma.workoutExecution.findFirst({
      where: { id: workoutId, userId, status: 'IN_PROGRESS' },
    });

    if (!workout) {
      throw new NotFoundException('Treino em progresso não encontrado');
    }

    // Verificar se exercícios existem
    const exercises = await this.prisma.exercise.findMany({
      where: {
        id: { in: dto.exerciseIds },
        userId,
      },
    });

    if (exercises.length !== dto.exerciseIds.length) {
      throw new BadRequestException('Alguns exercícios não foram encontrados');
    }

    // Criar execuções dos exercícios
    const exerciseExecutions = await Promise.all(
      dto.exerciseIds.map(async (exerciseId, index) => {
        const exercise = exercises.find((e) => e.id === exerciseId);

        if (!exercise) {
          throw new BadRequestException(
            `Exercício ${exerciseId} não encontrado`,
          );
        }

        return this.prisma.exerciseExecution.create({
          data: {
            workoutExecutionId: workoutId,
            exerciseId,
            exerciseName: exercise.name,
            order: index + 1,
            plannedSeries: 0,
          },
        });
      }),
    );

    return exerciseExecutions;
  }

  // 4. Definir quantas séries para um exercício
  async defineSeries(
    userId: string,
    workoutId: string,
    exerciseExecutionId: string,
    plannedSeries: number,
  ) {
    const exerciseExecution = await this.prisma.exerciseExecution.findFirst({
      where: {
        id: exerciseExecutionId,
        workoutExecution: {
          id: workoutId,
          userId,
          status: 'IN_PROGRESS',
        },
      },
    });

    if (!exerciseExecution) {
      throw new NotFoundException('Exercício não encontrado neste treino');
    }

    return this.prisma.exerciseExecution.update({
      where: { id: exerciseExecutionId },
      data: {
        plannedSeries: plannedSeries,
      },
    });
  }

  // 5. Registrar série executada
  async registerSeries(
    userId: string,
    workoutId: string,
    exerciseExecutionId: string,
    seriesNumber: number,
    dto: RegisterSeriesDto,
  ) {
    const exerciseExecution = await this.prisma.exerciseExecution.findFirst({
      where: {
        id: exerciseExecutionId,
        workoutExecution: {
          id: workoutId,
          userId,
          status: 'IN_PROGRESS',
        },
      },
    });

    if (!exerciseExecution) {
      throw new NotFoundException('Exercício não encontrado neste treino');
    }

    // Verificar se série já existe
    const existingSeries = await this.prisma.seriesExecution.findFirst({
      where: {
        exerciseExecutionId: exerciseExecutionId,
        seriesNumber: seriesNumber,
      },
    });

    if (existingSeries) {
      // Atualizar série existente
      return this.prisma.seriesExecution.update({
        where: { id: existingSeries.id },
        data: {
          weight: dto.weight,
          reps: dto.reps,
          restTime: dto.restTime,
          difficulty: dto.difficulty,
          notes: dto.notes,
        },
      });
    } else {
      // Criar nova série
      const seriesExecution = await this.prisma.seriesExecution.create({
        data: {
          exerciseExecutionId: exerciseExecutionId,
          seriesNumber: seriesNumber,
          weight: dto.weight,
          reps: dto.reps,
          restTime: dto.restTime,
          difficulty: dto.difficulty,
          notes: dto.notes,
        },
      });

      // Atualizar contador de séries completadas
      await this.prisma.exerciseExecution.update({
        where: { id: exerciseExecutionId },
        data: {
          completedSeries: {
            increment: 1,
          },
        },
      });

      return seriesExecution;
    }
  }

  // 6. Marcar exercício como completo
  async completeExercise(
    userId: string,
    workoutId: string,
    exerciseExecutionId: string,
  ) {
    const exerciseExecution = await this.prisma.exerciseExecution.findFirst({
      where: {
        id: exerciseExecutionId,
        workoutExecution: {
          id: workoutId,
          userId,
          status: 'IN_PROGRESS',
        },
      },
    });

    if (!exerciseExecution) {
      throw new NotFoundException('Exercício não encontrado neste treino');
    }

    return this.prisma.exerciseExecution.update({
      where: { id: exerciseExecutionId },
      data: {
        isCompleted: true,
      },
    });
  }

  // 7. Finalizar treino
  async finishWorkout(userId: string, workoutId: string, notes?: string) {
    const workout = await this.prisma.workoutExecution.findFirst({
      where: {
        id: workoutId,
        userId,
        status: 'IN_PROGRESS',
      },
      include: {
        exerciseExecutions: true,
      },
    });

    if (!workout) {
      throw new NotFoundException('Treino em progresso não encontrado');
    }

    return this.prisma.workoutExecution.update({
      where: { id: workoutId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        notes: notes || workout.notes,
      },
    });
  }

  // 8. Obter treino com detalhes
  async getWorkoutDetails(userId: string, workoutId: string) {
    return this.prisma.workoutExecution.findFirst({
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
  }

  // 9. Listar treinos do usuário
  async getUserWorkouts(userId: string) {
    return this.prisma.workoutExecution.findMany({
      where: { userId },
      include: {
        exerciseExecutions: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }
}
