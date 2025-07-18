import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { CurrentUser }    from '../auth/current-user.decorator';
import { User }           from '../auth/user.interface';
import { JwtAuthGuard }   from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  // Listar histórico de treinos com filtros e paginação
  @Get()
  async getWorkoutHistory(
    @CurrentUser() user: User,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('muscleGroup') muscleGroup?: string,
    @Query('search') search?: string,
  ) {
    return this.historyService.getWorkoutHistory(user.id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      startDate,
      endDate,
      muscleGroup,
      search,
    });
  }

  // Estatísticas gerais do histórico
  @Get('stats/overview')
  async getHistoryStats(
    @CurrentUser() user: User,
    @Query('period') period: 'week' | 'month' | 'year' | 'all' = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.historyService.getHistoryStats(user.id, period, startDate, endDate);
  }

  // Padrão semanal de treinos
  @Get('stats/weekly-pattern')
  async getWeeklyPattern(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.historyService.getWeeklyPattern(user.id, startDate, endDate);
  }

  // Top grupos musculares
  @Get('stats/muscle-groups')
  async getMuscleGroupStats(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.historyService.getMuscleGroupStats(user.id, startDate, endDate);
  }

  // Detalhes completos de um treino
  @Get(':id')
  async getWorkoutDetails(
    @CurrentUser() user: User,
    @Param('id') workoutId: string,
  ) {
    return this.historyService.getWorkoutDetails(user.id, workoutId);
  }

  // Duplicar treino
  @Get(':id/duplicate')
  async duplicateWorkout(
    @CurrentUser() user: User,
    @Param('id') workoutId: string,
  ) {
    return this.historyService.duplicateWorkout(user.id, workoutId);
  }

  // Deletar treino
  @Delete(':id')
  async deleteWorkout(
    @CurrentUser() user: User,
    @Param('id') workoutId: string,
  ) {
    return this.historyService.deleteWorkout(user.id, workoutId);
  }
}
