// src/auth/auth.module.ts
import { Module }           from '@nestjs/common';
import { PassportModule }   from '@nestjs/passport';
import { JwtModule }        from '@nestjs/jwt';
import { Reflector }        from '@nestjs/core';

import { JwtStrategy }      from './jwt.strategy';
import { JwtAuthGuard }     from './jwt.guard';
// lembre‑se: não há import de Public aqui!

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'gym-tracker-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    // DatabaseModule, etc.
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    Reflector,
  ],
  exports: [
    PassportModule,
    JwtModule,
    JwtAuthGuard,    // se você precisa aplicar guard em módulos filhos
    // NÃO exporte o Public
  ],
})
export class AuthModule {}
