# 🎨 DEMOS - Preview Visual do MVP

Esta pasta contém **mockups HTML estáticos** das telas principais do sistema para você visualizar a interface sem precisar configurar o Supabase.

## 📱 Demos Disponíveis

### 1. Login (Magic Link)
**Arquivo:** `login-demo.html`

**O que mostra:**
- Tela de login com magic link
- Campo de email
- Botão de envio
- Mensagem de sucesso

**Como visualizar:**
```bash
# Abra direto no navegador
open demo/login-demo.html
# ou
firefox demo/login-demo.html
# ou simplesmente clique duas vezes no arquivo
```

---

### 2. Treino do Dia (Aluno) - Principal
**Arquivo:** `treino-do-dia-demo.html`

**O que mostra:**
- Header com nome do treino e data
- Botões de ações rápidas (copiar última sessão, salvar)
- Lista de exercícios com inputs interativos
- Campos: séries, reps (texto livre), carga
- Botão de concluir treino
- TopNav com nome do usuário

**Funcionalidades interativas:**
- ✅ Inputs funcionam (você pode digitar)
- ✅ Botões mostram alerts ao clicar
- ✅ Visual fiel à implementação real
- ✅ Totalmente responsivo (teste no mobile!)

---

### 3. Dashboard Personal Trainer
**Arquivo:** `personal-dashboard-demo.html`

**O que mostra:**
- Cards de navegação (Alunos, Exercícios)
- Box com próximos passos
- Stats preview (futuro)
- Layout da área do personal

---

### 4. Empty State (Sem Treino)
**Arquivo:** `empty-state-demo.html`

**O que mostra:**
- Tela quando não há treino para o dia
- Ícone ilustrativo
- Mensagem explicativa
- Exemplo de configuração semanal
- Info sobre como funciona o sistema

---

## 🎯 Como Visualizar

### Opção 1: Abrir Diretamente
Clique duas vezes em qualquer arquivo `.html` e ele abrirá no seu navegador padrão.

### Opção 2: Via Terminal
```bash
# No diretório do projeto
cd demo

# Linux/Mac
open treino-do-dia-demo.html

# Windows
start treino-do-dia-demo.html

# Ou use um servidor local
python3 -m http.server 8080
# Depois acesse: http://localhost:8080/treino-do-dia-demo.html
```

### Opção 3: VS Code Live Server
1. Instale a extensão "Live Server"
2. Clique com botão direito no arquivo HTML
3. Selecione "Open with Live Server"

---

## 📱 Teste no Mobile

Todas as demos são **totalmente responsivas**!

### Testando no Desktop:
1. Abra no Chrome/Firefox
2. Pressione F12 (DevTools)
3. Clique no ícone de dispositivos móveis
4. Escolha um device (iPhone, Android)
5. Veja como fica no mobile!

### Testando no Celular Real:
1. Rode um servidor local: `python3 -m http.server 8080`
2. Pegue o IP da sua máquina: `ifconfig` (Mac/Linux) ou `ipconfig` (Windows)
3. Acesse no celular: `http://SEU-IP:8080/demo/treino-do-dia-demo.html`

---

## 🎨 Design System

### Cores
- **Primary:** Blue (600/700) - Ações principais
- **Success:** Green (600/700) - Concluir treino
- **Info:** Gray (100/200) - Ações secundárias
- **Backgrounds:** Gray 50 (fundo), White (cards)

### Typography
- **Títulos:** Font bold, 2xl-xl
- **Body:** Font normal, base
- **Labels:** Font medium, sm-xs
- **Inputs:** py-2/py-3 (mobile-friendly)

### Spacing
- **Mobile:** px-4 (16px)
- **Cards:** p-4 a p-6
- **Gaps:** gap-2 a gap-4

### Components
- **Cards:** Rounded-lg, shadow-sm
- **Buttons:** Rounded-lg, hover states
- **Inputs:** Rounded, focus:ring-2

---

## 📸 Screenshots (Descrição)

### Treino do Dia
```
┌─────────────────────────────────────────┐
│  TopNav: Meus Treinos | Sair            │
├─────────────────────────────────────────┤
│                                         │
│  📋 Treino A - Peito/Bíceps             │
│     segunda-feira, 19 de dezembro       │
│     Foco em hipertrofia                 │
│                                         │
│  [Copiar última sessão] [Salvar]        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Supino Reto        (Peito)      │   │
│  │ [Séries: 4] [Reps: 12/10/8/8]   │   │
│  │             [Carga: 60]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Rosca Direta       (Bíceps)     │   │
│  │ [Séries: 3] [Reps: 12/12/10]    │   │
│  │             [Carga: 30]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [✓ Concluir Treino]                   │
│                                         │
└─────────────────────────────────────────┘
```

### Login
```
┌─────────────────────────────────────────┐
│          Personal Trainer               │
│  Entre com seu email para receber       │
│        o link de acesso                 │
│                                         │
│  Email: [seu@email.com            ]     │
│                                         │
│  [     Enviar link mágico          ]    │
│                                         │
│  Acesso sem senha. Você receberá um     │
│  link mágico por email.                 │
└─────────────────────────────────────────┘
```

---

## 🔍 Comparação: Demo vs Real

| Feature | Demo (HTML) | Real (Next.js) |
|---------|-------------|----------------|
| Visual | ✅ Idêntico | ✅ Idêntico |
| Inputs funcionam | ✅ Sim | ✅ Sim |
| Salva dados | ❌ Alert apenas | ✅ Salva no Supabase |
| Copiar última sessão | ❌ Alert apenas | ✅ Busca do DB |
| Concluir treino | ❌ Alert apenas | ✅ Atualiza status |
| Auth | ❌ Simulado | ✅ Magic Link real |
| RLS | ❌ N/A | ✅ Row Level Security |
| Responsivo | ✅ 100% | ✅ 100% |

**Resumo:** O visual é 100% igual, mas a demo não salva dados (é só para visualizar).

---

## 💡 Dicas

1. **Teste em diferentes tamanhos de tela** - É mobile-first!
2. **Clique nos botões** - Eles mostram feedback
3. **Digite nos inputs** - Eles funcionam
4. **Veja o código fonte** - É HTML simples com Tailwind CDN
5. **Compare com a implementação real** - Os componentes React usam as mesmas classes

---

## 🎯 Use Cases

### Para Mostrar ao Cliente
```bash
# Abra todas as demos em abas separadas
open login-demo.html
open treino-do-dia-demo.html
open personal-dashboard-demo.html
open empty-state-demo.html
```

### Para Documentação
- Use como referência visual
- Print screens para apresentações
- Base para novos designs

### Para Desenvolvimento
- Teste CSS/Tailwind rapidamente
- Prototipe novos componentes
- Verifique responsividade

---

## 🚀 Próximas Demos (Futuras)

Quando as próximas entregas estiverem prontas, adicionar:

- [ ] `alunos-lista-demo.html` - Lista de alunos (Personal)
- [ ] `exercicios-lista-demo.html` - Biblioteca de exercícios (Personal)
- [ ] `template-criar-demo.html` - Criar template de treino (Personal)
- [ ] `historico-demo.html` - Histórico de treinos (Aluno)
- [ ] `dashboard-metricas-demo.html` - Dashboard com gráficos

---

## 📝 Notas Técnicas

**Tecnologia:**
- HTML5 puro
- Tailwind CSS via CDN
- JavaScript vanilla para interações básicas
- Sem dependências npm

**Vantagens:**
- ✅ Zero setup necessário
- ✅ Abre em qualquer navegador
- ✅ Ideal para apresentações
- ✅ Não precisa de backend

**Limitações:**
- ❌ Não salva dados persistentes
- ❌ Não tem autenticação real
- ❌ Dados são estáticos/mockados

---

## 🎉 Conclusão

Use estas demos para:
- ✅ Visualizar a interface sem setup
- ✅ Mostrar ao cliente/stakeholders
- ✅ Testar responsividade
- ✅ Entender o design system
- ✅ Referência para novos componentes

**Tempo para visualizar todas:** < 5 minutos  
**Setup necessário:** Zero! 🎯

---

**Próximo passo:** Configure o projeto real e veja funcionando com dados reais!  
Guia: `/SETUP.md`
