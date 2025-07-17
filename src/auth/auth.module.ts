import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'gym-tracker-secret-key',
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
