/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Post, Body, Query, UsePipes } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import {
  CreateExerciseDto,
  createExerciseSchema,
} from './dto/create-exercise.dto';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe';
import { PrismaService } from '../database/prisma.service';

@Controller('exercises')
export class ExercisesController {
  constructor(
    private readonly exercisesService: ExercisesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createExerciseSchema))
  async create(@Body() createExerciseDto: CreateExerciseDto) {
    // Pegar o primeiro usuário que existe no banco
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.exercisesService.create(user.id, createExerciseDto);
  }

  @Get()
  async findAll(@Query('muscleGroups') muscleGroups?: string) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    if (muscleGroups) {
      const groups = muscleGroups.split(',');
      return this.exercisesService.findByMuscleGroups(user.id, groups);
    }

    return this.exercisesService.findAll(user.id);
  }
}
