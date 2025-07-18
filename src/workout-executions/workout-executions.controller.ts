import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { WorkoutExecutionsService } from './workout-executions.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/user.interface';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { SelectExercisesDto } from './dto/select-exercises.dto';
import { RegisterSeriesDto } from './dto/register-series.dto';
import { PrismaService } from '../database/prisma.service';

@Controller('workout-executions')
export class WorkoutExecutionsController {
  constructor(
    private readonly workoutExecutionsService: WorkoutExecutionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('start')
  async startWorkout(
    @CurrentUser() user: User,
    @Body() startWorkoutDto: StartWorkoutDto,
  ) {
    return this.workoutExecutionsService.startWorkout(user.id, startWorkoutDto);
  }

  @Get(':workoutId/available-exercises')
  async getAvailableExercises(
    @CurrentUser() user: User,
    @Param('workoutId') workoutId: string,
  ) {
    return this.workoutExecutionsService.getAvailableExercises(user.id, workoutId);
  }

  @Post(':workoutId/select-exercises')
  async selectExercises(
    @CurrentUser() user: User,
    @Param('workoutId') workoutId: string,
    @Body() selectExercisesDto: SelectExercisesDto,
  ) {
    return this.workoutExecutionsService.selectExercises(user.id, workoutId, selectExercisesDto);
  }

  @Put(':workoutId/exercises/:exerciseExecutionId/series-count')
  async defineSeries(
    @CurrentUser() user: User,
    @Param('workoutId') workoutId: string,
    @Param('exerciseExecutionId') exerciseExecutionId: string,
    @Body('plannedSeries') plannedSeries: number,
  ) {
    return this.workoutExecutionsService.defineSeries(user.id, workoutId, exerciseExecutionId, plannedSeries);
  }

  @Post(':workoutId/exercises/:exerciseExecutionId/series/:seriesNumber')
  async registerSeries(
    @CurrentUser() user: User,
    @Param('workoutId') workoutId: string,
    @Param('exerciseExecutionId') exerciseExecutionId: string,
    @Param('seriesNumber') seriesNumber: string,
    @Body() registerSeriesDto: RegisterSeriesDto,
  ) {
    return this.workoutExecutionsService.registerSeries(
      user.id,
      workoutId,
      exerciseExecutionId,
      parseInt(seriesNumber),
      registerSeriesDto,
    );
  }

  @Put(':workoutId/exercises/:exerciseExecutionId/complete')
  async completeExercise(
    @CurrentUser() user: User,
    @Param('workoutId') workoutId: string,
    @Param('exerciseExecutionId') exerciseExecutionId: string,
  ) {
    return this.workoutExecutionsService.completeExercise(user.id, workoutId, exerciseExecutionId);
  }

  @Post(':workoutId/finish')
  async finishWorkout(
    @CurrentUser() user: User,
    @Param('workoutId') workoutId: string,
    @Body('notes') notes?: string,
  ) {
    return this.workoutExecutionsService.finishWorkout(user.id, workoutId, notes);
  }

  @Get(':workoutId')
  async getWorkoutDetails(
    @CurrentUser() user: User,
    @Param('workoutId') workoutId: string,
  ) {
    return this.workoutExecutionsService.getWorkoutDetails(user.id, workoutId);
  }

  @Get()
  async getUserWorkouts(@CurrentUser() user: User) {
    return this.workoutExecutionsService.getUserWorkouts(user.id);
  }

  @Delete(':workoutId')
  async deleteWorkout(
    @CurrentUser() user: User,
    @Param('workoutId') workoutId: string,
  ) {
    // Verificar se o treino existe e pertence ao usuário
    const workout = await this.prisma.workoutExecution.findFirst({
      where: { id: workoutId, userId: user.id }
    });

    if (!workout) {
      throw new Error('Treino não encontrado');
    }

    // Deletar treino e todos os dados relacionados (cascade)
    await this.prisma.workoutExecution.delete({
      where: { id: workoutId }
    });

    return { message: 'Treino deletado com sucesso' };
  }

  @Post('test')
  async test(@Body() body: any) {
    console.log('Body recebido:', body);
    return { message: 'Teste OK', body: body };
  }
}