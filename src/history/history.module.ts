// src/history/history.module.ts
import { Module }              from '@nestjs/common';
import { HistoryController }   from './history.controller';
import { HistoryService }      from './history.service';
import { AuthModule }          from '../auth/auth.module';    // <-- importe o AuthModule

@Module({
  imports: [
    AuthModule,           // <-- aqui
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
