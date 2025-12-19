# 📧 FEATURE 4: NOTIFICAÇÕES EMAIL (GUIA DE IMPLEMENTAÇÃO)

## ⚠️ Status: NÃO IMPLEMENTADO

Esta feature **não foi implementada** pois requer:
- Configuração de serviço externo (Resend)
- Deploy de Supabase Edge Functions
- API key que não pode ser testada localmente facilmente

Se você quiser implementar, siga este guia completo!

---

## 🎯 O que seria implementado

### Emails automáticos:

1. **Email diário (7h da manhã):**
   - "Bom dia! Seu treino de hoje: Peito/Tríceps"
   - Link direto para `/app/student/today`

2. **Reminder (48h sem treinar):**
   - "Sentimos sua falta! Que tal voltar aos treinos hoje?"
   - Mostrar streak atual (antes de quebrar)

3. **Notificação para personal:**
   - "João Silva completou o treino de Peito/Tríceps 💪"
   - Link para ver detalhes

4. **Resumo semanal (domingo 19h):**
   - "Resumo da semana: 4 de 5 treinos completados (80%)"
   - PRs batidos na semana
   - Badges desbloqueados

5. **Boas-vindas:**
   - Quando aluno aceita convite
   - Explicação básica da plataforma

---

## 🛠️ Stack Recomendado

### Resend (Email Service)
- **Gratuito:** 3000 emails/mês
- **Pago:** $10/mês para 50k emails
- **Docs:** https://resend.com/docs

### Supabase Edge Functions
- **Gratuito:** 500k invocações/mês
- Roda Deno no edge
- Agendamento via pg_cron

---

## 📋 PASSO 1: Configurar Resend

### 1.1 Criar conta
```bash
# Acesse https://resend.com
# Crie conta (gratuita)
# Verifique seu domínio (opcional) ou use resend.dev
```

### 1.2 Obter API Key
```bash
# Dashboard Resend → API Keys → Create API Key
# Nome: "Personal Trainer SaaS"
# Permissões: Sending access
```

### 1.3 Adicionar ao Supabase
```bash
# Supabase Dashboard → Settings → Secrets
# Adicionar: RESEND_API_KEY = sua-api-key-aqui
```

---

## 📋 PASSO 2: Criar Templates de Email

### Template: Email Diário

Criar arquivo: `/supabase/functions/_shared/templates/daily-workout.ts`

```typescript
export function getDailyWorkoutEmail(data: {
  studentName: string;
  templateName: string;
  exercises: string[];
}) {
  return {
    subject: `🏋️ Seu treino de hoje: ${data.templateName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .exercise { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ FitCoach Pro</h1>
              <p>Bom dia, ${data.studentName}!</p>
            </div>
            <div class="content">
              <h2>Seu treino de hoje: ${data.templateName}</h2>
              <p>Está na hora de se superar! 💪</p>
              
              <div style="margin: 20px 0;">
                ${data.exercises.map(ex => `<div class="exercise">✓ ${ex}</div>`).join('')}
              </div>
              
              <a href="${process.env.APP_URL}/app/student/today" class="button">
                Começar Treino →
              </a>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Mantenha sua sequência! 🔥
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
```

### Template: Reminder (48h)

Criar arquivo: `/supabase/functions/_shared/templates/reminder.ts`

```typescript
export function getReminderEmail(data: {
  studentName: string;
  currentStreak: number;
  lastWorkoutDate: string;
}) {
  return {
    subject: `Sentimos sua falta! Volte aos treinos hoje 🔥`,
    html: `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sentimos sua falta, ${data.studentName}!</h1>
            </div>
            <div class="content">
              <p>Você está há 2 dias sem treinar.</p>
              
              ${data.currentStreak > 0 ? `
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>⚠️ Sua sequência de ${data.currentStreak} dia(s) está em risco!</strong>
                </div>
              ` : ''}
              
              <p>Não deixe a preguiça vencer! Cada treino conta. 💪</p>
              
              <a href="${process.env.APP_URL}/app/student/today" class="button">
                Ver Treino do Dia →
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
```

---

## 📋 PASSO 3: Criar Edge Functions

### Function: send-daily-emails

Criar arquivo: `/supabase/functions/send-daily-emails/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendKey = Deno.env.get('RESEND_API_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's weekday (0-6)
    const today = new Date();
    const weekday = today.getDay();

    // Find students with templates for today
    const { data: templates } = await supabase
      .from('workout_templates')
      .select(`
        *,
        student:students!inner(
          student_name,
          student_email,
          student_user_id
        ),
        workout_template_exercises(
          exercise:exercises(name)
        )
      `)
      .eq('weekday', weekday);

    if (!templates || templates.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send emails
    const emailPromises = templates.map(async (template) => {
      const exercises = template.workout_template_exercises.map(
        (wte: any) => wte.exercise.name
      );

      return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'FitCoach Pro <noreply@resend.dev>',
          to: template.student.student_email,
          subject: `🏋️ Seu treino de hoje: ${template.name}`,
          html: getDailyWorkoutEmail({
            studentName: template.student.student_name,
            templateName: template.name,
            exercises,
          }).html,
        }),
      });
    });

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ sent: templates.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 📋 PASSO 4: Agendar Execução (pg_cron)

### 4.1 Habilitar pg_cron no Supabase

```sql
-- No SQL Editor do Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 4.2 Criar Jobs

```sql
-- Email diário (7h da manhã, horário de Brasília = UTC-3)
SELECT cron.schedule(
  'daily-workout-emails',
  '0 10 * * *', -- 10h UTC = 7h BRT
  $$
  SELECT net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/send-daily-emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  );
  $$
);

-- Reminder 48h (19h da noite)
SELECT cron.schedule(
  'reminder-emails',
  '0 22 * * *', -- 22h UTC = 19h BRT
  $$
  SELECT net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/send-reminder-emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  );
  $$
);

-- Resumo semanal (domingo 19h)
SELECT cron.schedule(
  'weekly-summary-emails',
  '0 22 * * 0', -- Domingo 22h UTC = 19h BRT
  $$
  SELECT net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/send-weekly-summary',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  );
  $$
);
```

---

## 📋 PASSO 5: Deploy Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-projeto-id

# Deploy functions
supabase functions deploy send-daily-emails
supabase functions deploy send-reminder-emails
supabase functions deploy send-weekly-summary

# Setar secrets
supabase secrets set RESEND_API_KEY=sua-api-key
supabase secrets set APP_URL=https://seu-app.vercel.app
```

---

## 📋 PASSO 6: Testar Manualmente

### Via cURL:
```bash
curl -X POST \
  https://seu-projeto.supabase.co/functions/v1/send-daily-emails \
  -H "Authorization: Bearer sua-anon-key"
```

### Verificar Logs:
```bash
# Supabase Dashboard → Edge Functions → Logs
# Ou via CLI:
supabase functions logs send-daily-emails --tail
```

---

## 🎨 Templates Adicionais Sugeridos

### 1. Workout Completed (para personal)
```typescript
export function getWorkoutCompletedEmail(data: {
  personalName: string;
  studentName: string;
  templateName: string;
  duration: number;
  totalSets: number;
}) {
  return {
    subject: `${data.studentName} completou o treino! 💪`,
    html: `...`,
  };
}
```

### 2. Weekly Summary
```typescript
export function getWeeklySummaryEmail(data: {
  studentName: string;
  treinos: number;
  meta: number;
  percentual: number;
  streak: number;
  badges: string[];
}) {
  return {
    subject: `Resumo da semana: ${data.percentual}% de aderência`,
    html: `...`,
  };
}
```

### 3. Welcome Email
```typescript
export function getWelcomeEmail(data: {
  studentName: string;
  personalName: string;
}) {
  return {
    subject: `Bem-vindo ao FitCoach Pro! 🎉`,
    html: `...`,
  };
}
```

---

## 💰 Custos Estimados

### Cenário: 50 alunos

| Tipo de Email | Frequência | Emails/mês | Custo Resend |
|---------------|-----------|------------|--------------|
| Diário | 1x/dia | 1500 | Grátis |
| Reminder | 2x/semana | 400 | Grátis |
| Resumo Semanal | 1x/semana | 200 | Grátis |
| Workout Completed | 5x/semana | 1000 | Grátis |
| **TOTAL** | - | **3100/mês** | **$0** |

✅ **Gratuito até 3000 emails/mês!**

---

## ⚙️ Configurações Avançadas

### Rate Limiting
```typescript
// Evitar spam
const lastEmailSent = await supabase
  .from('email_logs')
  .select('sent_at')
  .eq('student_id', studentId)
  .eq('type', 'daily')
  .order('sent_at', { ascending: false })
  .limit(1);

if (lastEmailSent && isToday(lastEmailSent.sent_at)) {
  return; // Já enviou hoje
}
```

### Preferências do Usuário
```sql
-- Adicionar à tabela students
ALTER TABLE students ADD COLUMN email_preferences JSONB DEFAULT '{
  "daily": true,
  "reminder": true,
  "weekly": true,
  "achievements": true
}'::jsonb;
```

### Tracking de Abertura
```typescript
// Resend suporta tracking automaticamente
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  body: JSON.stringify({
    ...emailData,
    tags: [
      { name: 'type', value: 'daily-workout' },
      { name: 'student_id', value: studentId },
    ],
  }),
});
```

---

## 🧪 Como Testar

### 1. Teste Local (sem enviar emails):
```typescript
// Adicione flag de ambiente
if (Deno.env.get('ENVIRONMENT') === 'development') {
  console.log('Email que seria enviado:', emailData);
  return new Response(JSON.stringify({ mock: true }));
}
```

### 2. Teste com Email Real:
```bash
# Use seu próprio email para testar
curl -X POST https://seu-projeto.supabase.co/functions/v1/send-daily-emails \
  -H "Authorization: Bearer sua-anon-key"

# Verifique sua caixa de entrada
```

---

## 📊 Métricas Recomendadas

Adicionar tabela para tracking:

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  type TEXT NOT NULL, -- 'daily', 'reminder', 'weekly', etc
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

CREATE INDEX idx_email_logs_student ON email_logs(student_id);
CREATE INDEX idx_email_logs_type ON email_logs(type);
```

---

## ✅ Checklist de Implementação

- [ ] Criar conta Resend
- [ ] Obter API key
- [ ] Adicionar secret no Supabase
- [ ] Criar templates de email
- [ ] Criar Edge Functions
- [ ] Deploy Edge Functions
- [ ] Habilitar pg_cron
- [ ] Criar cron jobs
- [ ] Testar envio manual
- [ ] Testar agendamento
- [ ] Configurar tracking
- [ ] Adicionar preferências do usuário

---

## 🎯 Resultado Final

Após implementar, você terá:
- ✅ Emails automáticos diários
- ✅ Reminders inteligentes
- ✅ Resumos semanais
- ✅ Notificações para personal
- ✅ Tracking de abertura
- ✅ Preferências personalizáveis

**Tempo estimado:** 4-6 horas

**Complexidade:** Média-Alta

**Custo:** $0 até 3000 emails/mês

---

**Boa sorte com a implementação! 📧🚀**
