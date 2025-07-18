import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any) {
    try {
      // LOG para debug - remover em produção
      console.log('🔍 ZodValidationPipe - Dados recebidos:', JSON.stringify(value, null, 2));
      
      const parsedValue = this.schema.parse(value);
      
      // LOG para debug - remover em produção
      console.log('✅ ZodValidationPipe - Validação passou:', JSON.stringify(parsedValue, null, 2));
      
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('❌ ZodValidationPipe - Erro de validação:', error.issues);
        
        // Formatando erros de forma mais clara
        const formattedErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        throw new BadRequestException({
          message: 'Dados inválidos',
          errors: formattedErrors
        });
      }
      
      console.error('❌ ZodValidationPipe - Erro desconhecido:', error);
      throw new BadRequestException('Erro de validação');
    }
  }
}