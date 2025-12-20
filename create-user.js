#!/usr/bin/env node

/**
 * Script Node.js para criar usuário Personal Trainer
 * 
 * Como usar:
 * 1. Certifique-se de que o servidor está rodando (npm run dev)
 * 2. Execute: node create-user.js
 * 3. Siga as instruções
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createUser() {
  console.log('\n🚀 Criar Usuário Personal Trainer\n');
  console.log('⚠️  Certifique-se de que o servidor está rodando (npm run dev)\n');

  try {
    const email = await question('Email: ');
    const password = await question('Senha (mínimo 6 caracteres): ');
    const name = await question('Nome: ');

    if (!email || !password || !name) {
      console.log('\n❌ Todos os campos são obrigatórios!');
      rl.close();
      return;
    }

    if (password.length < 6) {
      console.log('\n❌ A senha deve ter no mínimo 6 caracteres!');
      rl.close();
      return;
    }

    console.log('\n⏳ Criando usuário...\n');

    const response = await fetch('http://localhost:3000/api/admin/create-first-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Usuário criado com sucesso!\n');
      console.log('Detalhes:');
      console.log(`  Email: ${data.user.email}`);
      console.log(`  Nome: ${data.user.name}`);
      console.log(`  Role: ${data.user.role}`);
      console.log(`  ID: ${data.user.id}\n`);
      console.log('📋 Próximos passos:');
      console.log('  1. Faça login na aplicação com este email e senha');
      console.log('  2. Você será redirecionado para /app/personal');
      console.log('  3. DELETE o arquivo app/api/admin/create-first-user/route.ts\n');
    } else {
      console.log('❌ Erro ao criar usuário!\n');
      console.log(`Erro: ${data.error || 'Erro desconhecido'}`);
      if (data.details) {
        console.log(`Detalhes: ${data.details}`);
      }
      console.log('');
    }
  } catch (error) {
    console.log('\n❌ Erro de conexão!');
    console.log('Verifique se o servidor está rodando (npm run dev)');
    console.log(`Erro: ${error.message}\n`);
  } finally {
    rl.close();
  }
}

// Verificar se fetch está disponível (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ Este script requer Node.js 18+ (que tem fetch nativo)');
  console.log('Ou instale node-fetch: npm install node-fetch\n');
  process.exit(1);
}

createUser();





