import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../database/prisma.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  // Relatório geral de treinos
  @Get('overview')
  async getWorkoutOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.reportsService.getWorkoutOverview(user.id, startDate, endDate);
  }

  // Relatório de progresso por exercício
  @Get('exercise-progress')
  async getExerciseProgress(
    @Query('exerciseId') exerciseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.reportsService.getExerciseProgress(
      user.id,
      exerciseId,
      startDate,
      endDate,
    );
  }

  // Relatório de frequência de treinos
  @Get('frequency')
  async getWorkoutFrequency(
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.reportsService.getWorkoutFrequency(
      user.id,
      period,
      startDate,
      endDate,
    );
  }

  // Relatório por grupo muscular
  @Get('muscle-groups')
  async getMuscleGroupAnalysis(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.reportsService.getMuscleGroupAnalysis(
      user.id,
      startDate,
      endDate,
    );
  }

  // Relatório de volume de treino (peso x repetições)
  @Get('volume')
  async getVolumeAnalysis(
    @Query('exerciseId') exerciseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.reportsService.getVolumeAnalysis(
      user.id,
      exerciseId,
      startDate,
      endDate,
    );
  }

  // Relatório de recordes pessoais
  @Get('personal-records')
  async getPersonalRecords(
    @Query('exerciseId') exerciseId?: string,
    @Query('type') type: 'weight' | 'reps' | 'volume' = 'weight',
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.reportsService.getPersonalRecords(user.id, exerciseId, type);
  }

  // Relatório de duração dos treinos
  @Get('duration')
  async getWorkoutDuration(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.reportsService.getWorkoutDuration(user.id, startDate, endDate);
  }

  // Relatório de consistência (dias da semana mais ativos)
  @Get('consistency')
  async getWorkoutConsistency(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.reportsService.getWorkoutConsistency(
      user.id,
      startDate,
      endDate,
    );
  }

  // Relatório de evolução de peso e repetições (NOVO)
  @Get('evolution')
  async getWeightRepsEvolution(
    @Query('exerciseId') exerciseId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('seriesType') seriesType: 'max' | 'average' | 'all' = 'max',
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    if (!exerciseId) {
      throw new Error('exerciseId é obrigatório para análise de evolução');
    }

    return this.reportsService.getWeightRepsEvolution(
      user.id,
      exerciseId,
      startDate,
      endDate,
      seriesType,
    );
  }

  // Comparar múltiplos exercícios
  @Get('compare-exercises')
  async compareExercises(
    @Query('exerciseIds') exerciseIds: string, // IDs separados por vírgula
    @Query('metric') metric: 'weight' | 'reps' | 'volume' = 'weight',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    const ids = exerciseIds.split(',').filter(id => id.trim());
    if (ids.length === 0) {
      throw new Error('Pelo menos um exerciseId deve ser fornecido');
    }

    return this.reportsService.compareExercises(
      user.id,
      ids,
      metric,
      startDate,
      endDate,
    );
  }

  // Análise de força (peso máximo por repetições)
  @Get('strength-analysis')
  async getStrengthAnalysis(
    @Query('exerciseId') exerciseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.reportsService.getStrengthAnalysis(
      user.id,
      exerciseId,
      startDate,
      endDate,
    );
  }

  // Relatório completo em PDF/JSON
  @Get('complete')
  async getCompleteReport(
    @Query('format') format: 'json' | 'summary' = 'summary',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('Nenhum usuário encontrado');
    }

    return this.reportsService.getCompleteReport(
      user.id,
      format,
      startDate,
      endDate,
    );
  }
}