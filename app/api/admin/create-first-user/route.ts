import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Force dynamic rendering to avoid build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CreateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório'),
});

/**
 * ENDPOINT TEMPORÁRIO PARA CRIAR O PRIMEIRO USUÁRIO PERSONAL
 * 
 * ⚠️ IMPORTANTE: Delete este arquivo após criar seu usuário!
 * 
 * Como usar:
 * 1. Faça uma requisição POST para /api/admin/create-first-user
 * 2. Body: { "email": "seu@email.com", "password": "suaSenha123", "name": "Seu Nome" }
 * 3. Depois de criar, delete este arquivo por segurança
 */
export async function POST(request: Request) {
  try {
    // Verificar se SERVICE_ROLE_KEY está configurada
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL não configurada' },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Validar dados
    const validationResult = CreateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;

    // Criar cliente admin
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verificar se já existe usuário
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      // Usuário já existe
      userId = existingUser.id;
      console.log('Usuário já existe, usando ID:', userId);
    } else {
      // Criar novo usuário
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          name,
        },
      });

      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        return NextResponse.json(
          { 
            error: 'Erro ao criar usuário',
            details: createError.message
          },
          { status: 400 }
        );
      }

      if (!newUser.user) {
        return NextResponse.json(
          { error: 'Usuário não foi criado' },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
      console.log('✅ Usuário criado com ID:', userId);
    }

    // Criar ou atualizar profile como personal trainer
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        role: 'personal',
        name: name,
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Erro ao criar profile:', profileError);
      return NextResponse.json(
        { 
          error: 'Erro ao criar profile',
          details: profileError.message
        },
        { status: 500 }
      );
    }

    console.log('✅ Profile criado como personal trainer');

    return NextResponse.json({
      success: true,
      message: 'Usuário personal trainer criado com sucesso!',
      user: {
        id: userId,
        email,
        name,
        role: 'personal',
      },
      instructions: [
        '1. Agora você pode fazer login com este email e senha',
        '2. Após confirmar que funciona, DELETE este arquivo: app/api/admin/create-first-user/route.ts',
        '3. Este endpoint é temporário e não deve ficar em produção!',
      ],
    });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao criar usuário',
        details: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}




