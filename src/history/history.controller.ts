import { Controller, Get, Query, Param, Delete } from '@nestjs/common';
import { HistoryService } from './history.service';
import { PrismaService } from '../database/prisma.service';

@Controller('history')
export class HistoryController {
  constructor(
    private readonly historyService: HistoryService,
    private readonly prisma: PrismaService,
  ) {}

  // Listar histórico de treinos com filtros e paginação
  @Get()
  async getWorkoutHistory(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('muscleGroup') muscleGroup?: string,
    @Query('search') search?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.historyService.getWorkoutHistory(user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      startDate,
      endDate,
      muscleGroup,
      search,
    });
  }

  // Detalhes de um treino específico
  @Get(':id')
  async getWorkoutDetails(@Param('id') workoutId: string) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.historyService.getWorkoutDetails(user.id, workoutId);
  }

  // Estatísticas do histórico
  @Get('stats/overview')
  async getHistoryStats(
    @Query('period') period: 'week' | 'month' | 'year' | 'all' = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.historyService.getHistoryStats(user.id, period, startDate, endDate);
  }

  // Deletar treino do histórico
  @Delete(':id')
  async deleteWorkout(@Param('id') workoutId: string) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.historyService.deleteWorkout(user.id, workoutId);
  }

  // Treinos por dia da semana
  @Get('stats/weekly-pattern')
  async getWeeklyPattern(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.historyService.getWeeklyPattern(user.id, startDate, endDate);
  }

  // Grupos musculares mais treinados
  @Get('stats/muscle-groups')
  async getMuscleGroupStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.historyService.getMuscleGroupStats(user.id, startDate, endDate);
  }

  // Duplicar treino (criar novo baseado em um existente)
  @Get(':id/duplicate')
  async duplicateWorkout(@Param('id') workoutId: string) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.historyService.duplicateWorkout(user.id, workoutId);
  }
}