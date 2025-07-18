import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt.guard';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutExecutionsModule } from './workout-executions/workout-executions.module';
import { ReportsModule } from './reports/reports.module';
import { HistoryModule } from './history/history.module';
import { envSchema } from './env/env';

// Controllers
import { CreateAccountController } from './controllers/create-account.controller';
import { AuthenticateController } from './controllers/authenticate-controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ExercisesModule,
    WorkoutExecutionsModule,
    ReportsModule,
    HistoryModule,
  ],
  controllers: [CreateAccountController, AuthenticateController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}