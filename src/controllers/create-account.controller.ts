import {
  ConflictException,
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../database/prisma.service';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe';

const createAccountBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>;

@Controller('/accounts')
export class CreateAccountController {
  constructor(private prisma: PrismaService) {}

  @Public() // Rota pública
  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async createAccount(@Body() body: CreateAccountBodySchema) {
    const { name, email, password } = body;

    const userWithSameEmail = await this.prisma.user.findFirst({
      where: { email },
    });

    if (userWithSameEmail) {
      throw new ConflictException('Email já utilizado');
    }

    const hashedPassword = await hash(password, 8);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
