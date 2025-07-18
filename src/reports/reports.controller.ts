import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/user.interface';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  async getWorkoutOverview(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getWorkoutOverview(user.id, startDate, endDate);
  }

  @Get('exercise-progress')
  async getExerciseProgress(
    @CurrentUser() user: User,
    @Query('exerciseId') exerciseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getExerciseProgress(user.id, exerciseId, startDate, endDate);
  }

  @Get('frequency')
  async getWorkoutFrequency(
    @CurrentUser() user: User,
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getWorkoutFrequency(user.id, period, startDate, endDate);
  }

  @Get('muscle-groups')
  async getMuscleGroupAnalysis(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getMuscleGroupAnalysis(user.id, startDate, endDate);
  }

  @Get('volume')
  async getVolumeAnalysis(
    @CurrentUser() user: User,
    @Query('exerciseId') exerciseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getVolumeAnalysis(user.id, exerciseId, startDate, endDate);
  }

  @Get('personal-records')
  async getPersonalRecords(
    @CurrentUser() user: User,
    @Query('exerciseId') exerciseId?: string,
    @Query('type') type: 'weight' | 'reps' | 'volume' = 'weight',
  ) {
    return this.reportsService.getPersonalRecords(user.id, exerciseId, type);
  }

  @Get('duration')
  async getWorkoutDuration(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getWorkoutDuration(user.id, startDate, endDate);
  }

  @Get('consistency')
  async getWorkoutConsistency(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getWorkoutConsistency(user.id, startDate, endDate);
  }

  @Get('evolution')
  async getWeightRepsEvolution(
    @CurrentUser() user: User,
    @Query('exerciseId') exerciseId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('seriesType') seriesType: 'max' | 'average' | 'all' = 'max',
  ) {
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

  @Get('compare-exercises')
  async compareExercises(
    @CurrentUser() user: User,
    @Query('exerciseIds') exerciseIds: string,
    @Query('metric') metric: 'weight' | 'reps' | 'volume' = 'weight',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const ids = exerciseIds.split(',').filter(id => id.trim());
    if (ids.length === 0) {
      throw new Error('Pelo menos um exerciseId deve ser fornecido');
    }

    return this.reportsService.compareExercises(user.id, ids, metric, startDate, endDate);
  }

  @Get('strength-analysis')
  async getStrengthAnalysis(
    @CurrentUser() user: User,
    @Query('exerciseId') exerciseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getStrengthAnalysis(user.id, exerciseId, startDate, endDate);
  }

  @Get('complete')
  async getCompleteReport(
    @CurrentUser() user: User,
    @Query('format') format: 'json' | 'summary' = 'summary',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCompleteReport(user.id, format, startDate, endDate);
  }
}