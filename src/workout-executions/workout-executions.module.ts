import { Module } from '@nestjs/common';
import { WorkoutExecutionsService } from './workout-executions.service';
import { WorkoutExecutionsController } from './workout-executions.controller';

@Module({
  controllers: [WorkoutExecutionsController],
  providers: [WorkoutExecutionsService],
})
export class WorkoutExecutionsModule {}
