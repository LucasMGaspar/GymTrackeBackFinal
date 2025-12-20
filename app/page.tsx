import Link from 'next/link';
import { ArrowRight, Check, Users, BarChart3, MessageSquare, TrendingUp, Shield, Zap, Clock, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">FitCoachPro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/plans"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Planos
              </Link>
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/plans"
                className="bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg"
              >
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <div className="inline-block mb-6">
            <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold">
              ✨ Plataforma #1 para Personal Trainers
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Gerencie seus alunos de forma
            <span className="text-primary-600 block">profissional</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            A plataforma completa para personal trainers criarem treinos personalizados, 
            acompanharem o progresso dos alunos e escalarem seus negócios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/plans"
              className="bg-primary-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center transform hover:scale-105"
            >
              Ver Planos
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/login"
              className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all border-2 border-gray-200 shadow-md hover:shadow-lg"
            >
              Fazer Login
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary-500" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary-500" />
              <span>Teste grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary-500" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600">Personal Trainers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">10k+</div>
              <div className="text-gray-600">Alunos Ativos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">50k+</div>
              <div className="text-gray-600">Treinos Criados</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">98%</div>
              <div className="text-gray-600">Satisfação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Funcionalidades poderosas para transformar sua forma de trabalhar e escalar seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-primary-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Gestão de Alunos
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Organize todos os seus alunos em um só lugar. Crie perfis completos, 
                acompanhe histórico de treinos e gerencie múltiplos alunos com facilidade.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-primary-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Treinos Personalizados
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Crie treinos únicos para cada aluno. Defina exercícios, séries, 
                repetições e acompanhe o progresso em tempo real com relatórios detalhados.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-primary-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Comunicação Direta
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Mantenha contato com seus alunos através de comentários nos treinos 
                e notificações automáticas via WhatsApp (planos Pro e Business).
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-primary-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Relatórios e Analytics
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Acompanhe o desempenho dos seus alunos com relatórios mensais detalhados, 
                gráficos de evolução e métricas de progresso.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-primary-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Interface Intuitiva
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Plataforma moderna e fácil de usar. Crie treinos em minutos, 
                sem necessidade de conhecimento técnico.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-primary-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Segurança e Privacidade
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Seus dados e os de seus alunos estão protegidos com criptografia 
                de ponta e backups automáticos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comece a usar em minutos, sem complicação
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Escolha seu plano</h3>
              <p className="text-gray-600">
                Selecione o plano ideal para o seu negócio. Teste grátis disponível em todos os planos pagos.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Crie sua conta</h3>
              <p className="text-gray-600">
                Faça login com seu email. Receba um link mágico e comece a usar imediatamente.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Comece a gerenciar</h3>
              <p className="text-gray-600">
                Adicione seus alunos, crie treinos personalizados e acompanhe o progresso de cada um.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-gray-600">
              Personal trainers que transformaram seus negócios
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "A plataforma revolucionou minha forma de trabalhar. Agora consigo gerenciar 50+ alunos 
                sem perder qualidade no atendimento. Os relatórios são incríveis!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">MC</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Maria Costa</div>
                  <div className="text-sm text-gray-500">Personal Trainer</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "A interface é muito intuitiva. Meus alunos adoram poder ver os treinos no celular 
                e eu consigo acompanhar tudo em tempo real. Recomendo 100%!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">JS</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">João Silva</div>
                  <div className="text-sm text-gray-500">Personal Trainer</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "Economizei horas de trabalho por semana. A criação de treinos ficou muito mais rápida 
                e os alunos estão mais engajados. Vale cada centavo!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">AS</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Ana Santos</div>
                  <div className="text-sm text-gray-500">Dona de Academia</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de personal trainers que já estão escalando seus negócios com o FitCoachPro.
          </p>
          <Link
            href="/plans"
            className="bg-white text-primary-600 px-10 py-5 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl inline-flex items-center transform hover:scale-105"
          >
            Ver Planos e Preços
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <p className="text-primary-200 text-sm mt-6">
            ✓ Teste grátis • ✓ Sem cartão de crédito • ✓ Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4">FitCoachPro</h3>
              <p className="text-gray-400 text-sm">
                A plataforma completa para personal trainers gerenciarem seus alunos e escalarem seus negócios.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/plans" className="hover:text-white transition-colors">Planos</Link></li>
                <li><Link href="/plans" className="hover:text-white transition-colors">Preços</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 FitCoachPro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
