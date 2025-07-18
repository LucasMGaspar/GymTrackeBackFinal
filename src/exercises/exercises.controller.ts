import { Controller, Get, Post, Body, Query, UsePipes } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/user.interface';
import {
  CreateExerciseDto,
  createExerciseSchema,
} from './dto/create-exercise.dto';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createExerciseSchema)) createExerciseDto: CreateExerciseDto,
  ) {
    // LOGS para debug - remover em produção
    console.log('=== EXERCISES CONTROLLER CREATE ===');
    console.log('User recebido:', user);
    console.log('User ID:', user?.id);
    console.log('DTO recebido:', JSON.stringify(createExerciseDto, null, 2));
    console.log('====================================');

    // Validação adicional de segurança
    if (!user || !user.id) {
      throw new Error('Usuário não encontrado ou inválido');
    }

    return this.exercisesService.create(user.id, createExerciseDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('muscleGroups') muscleGroups?: string,
  ) {
    // LOG para debug - remover em produção
    console.log('=== EXERCISES CONTROLLER FIND ALL ===');
    console.log('User:', user?.id);
    console.log('MuscleGroups filter:', muscleGroups);
    console.log('======================================');

    if (muscleGroups) {
      const groups = muscleGroups.split(',');
      return this.exercisesService.findByMuscleGroups(user.id, groups);
    }

    return this.exercisesService.findAll(user.id);
  }
}