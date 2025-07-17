import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { WorkoutExecutionsService } from './workout-executions.service';
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

  // 1. Iniciar treino
  @Post('start')
  async startWorkout(@Body() startWorkoutDto: StartWorkoutDto) {
    // Usar primeiro usuário para teste
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.workoutExecutionsService.startWorkout(user.id, startWorkoutDto);
  }

  // 2. Obter exercícios disponíveis para o treino
  @Get(':workoutId/available-exercises')
  async getAvailableExercises(@Param('workoutId') workoutId: string) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.workoutExecutionsService.getAvailableExercises(user.id, workoutId);
  }

  // 3. Selecionar exercícios para o treino
  @Post(':workoutId/select-exercises')
  async selectExercises(
    @Param('workoutId') workoutId: string,
    @Body() selectExercisesDto: SelectExercisesDto,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.workoutExecutionsService.selectExercises(user.id, workoutId, selectExercisesDto);
  }

  // 4. Definir quantas séries para um exercício
  @Put(':workoutId/exercises/:exerciseExecutionId/series-count')
  async defineSeries(
    @Param('workoutId') workoutId: string,
    @Param('exerciseExecutionId') exerciseExecutionId: string,
    @Body('plannedSeries') plannedSeries: number,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.workoutExecutionsService.defineSeries(user.id, workoutId, exerciseExecutionId, plannedSeries);
  }

  // 5. Registrar série
  @Post(':workoutId/exercises/:exerciseExecutionId/series/:seriesNumber')
  async registerSeries(
    @Param('workoutId') workoutId: string,
    @Param('exerciseExecutionId') exerciseExecutionId: string,
    @Param('seriesNumber') seriesNumber: string,
    @Body() registerSeriesDto: RegisterSeriesDto,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.workoutExecutionsService.registerSeries(
      user.id,
      workoutId,
      exerciseExecutionId,
      parseInt(seriesNumber),
      registerSeriesDto,
    );
  }

  // 6. Marcar exercício como completo
  @Put(':workoutId/exercises/:exerciseExecutionId/complete')
  async completeExercise(
    @Param('workoutId') workoutId: string,
    @Param('exerciseExecutionId') exerciseExecutionId: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.workoutExecutionsService.completeExercise(user.id, workoutId, exerciseExecutionId);
  }

  // 7. Finalizar treino
  @Post(':workoutId/finish')
  async finishWorkout(
    @Param('workoutId') workoutId: string,
    @Body('notes') notes?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.workoutExecutionsService.finishWorkout(user.id, workoutId, notes);
  }

  // 8. Obter detalhes do treino
  @Get(':workoutId')
  async getWorkoutDetails(@Param('workoutId') workoutId: string) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.workoutExecutionsService.getWorkoutDetails(user.id, workoutId);
  }

  // 9. Listar treinos do usuário
  @Get()
  async getUserWorkouts() {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.workoutExecutionsService.getUserWorkouts(user.id);
  }

  // 10. Deletar treino
  @Delete(':workoutId')
  async deleteWorkout(@Param('workoutId') workoutId: string) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }
    
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

  // 11. Método de teste (temporário)
  @Post('test')
  async test(@Body() body: any) {
    console.log('Body recebido:', body);
    return { message: 'Teste OK', body: body };
  }
}