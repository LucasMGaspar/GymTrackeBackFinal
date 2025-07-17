/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateExerciseDto) {
    // Verificar se exercício já existe para este usuário
    const existingExercise = await this.prisma.exercise.findFirst({
      where: {
        userId,
        name: data.name,
      },
    });

    if (existingExercise) {
      throw new ConflictException('Exercício já existe');
    }

    return this.prisma.exercise.create({
      data: {
        userId,
        name: data.name,
        muscleGroups: data.muscleGroups,
        equipment: data.equipment,
        instructions: data.instructions,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.exercise.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findByMuscleGroups(userId: string, muscleGroups: string[]) {
    // Filtrar exercícios que contenham pelo menos um dos grupos musculares
    const exercises = await this.prisma.exercise.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return exercises.filter((exercise) => {
      const exerciseMuscleGroups = exercise.muscleGroups as string[];
      return muscleGroups.some((group) => exerciseMuscleGroups.includes(group));
    });
  }
}
