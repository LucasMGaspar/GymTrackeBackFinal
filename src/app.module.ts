/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutExecutionsModule } from './workout-executions/workout-executions.module';
import { ReportsModule } from './reports/reports.module';
import { HistoryModule } from './history/history.module'; // ← NOVO
import { envSchema } from './env/env';

// Controllers
import { CreateAccountController } from './controllers/create-account.controller';
import { AuthenticateController } from './controllers/authenticate-controller';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ExercisesModule,
    WorkoutExecutionsModule,
    ReportsModule,
    HistoryModule, // ← ADICIONE ESTA LINHA
  ],
  controllers: [CreateAccountController, AuthenticateController],
})
export class AppModule {}