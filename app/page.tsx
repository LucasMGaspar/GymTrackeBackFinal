import Link from 'next/link';
import { ArrowRight, Check, Users, BarChart3, MessageSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">FitCoachPro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/plans"
                className="text-gray-700 hover:text-primary-600 font-medium"
              >
                Planos
              </Link>
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary-600 font-medium"
              >
                Entrar
              </Link>
              <Link
                href="/plans"
                className="bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Gerencie seus alunos de forma
            <span className="text-primary-600"> profissional</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A plataforma completa para personal trainers criarem treinos personalizados, 
            acompanharem o progresso dos alunos e escalarem seus negócios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/plans"
              className="bg-primary-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              Ver Planos
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/login"
              className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors border-2 border-gray-200"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600">
              Funcionalidades poderosas para transformar sua forma de trabalhar
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gray-50">
              <Users className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Gestão de Alunos
              </h3>
              <p className="text-gray-600">
                Organize todos os seus alunos em um só lugar. Crie perfis completos, 
                acompanhe histórico e gerencie múltiplos alunos com facilidade.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gray-50">
              <BarChart3 className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Treinos Personalizados
              </h3>
              <p className="text-gray-600">
                Crie treinos únicos para cada aluno. Defina exercícios, séries, 
                repetições e acompanhe o progresso em tempo real.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gray-50">
              <MessageSquare className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Comunicação
              </h3>
              <p className="text-gray-600">
                Mantenha contato com seus alunos através de comentários nos treinos 
                e notificações via WhatsApp (planos Pro e Business).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Escolha o plano ideal para o seu negócio e comece a gerenciar seus alunos hoje mesmo.
          </p>
          <Link
            href="/plans"
            className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl inline-flex items-center"
          >
            Ver Planos e Preços
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">FitCoachPro</h3>
            <p className="text-gray-400 mb-6">
              A plataforma completa para personal trainers gerenciarem seus alunos
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/plans" className="text-gray-400 hover:text-white">
                Planos
              </Link>
              <Link href="/login" className="text-gray-400 hover:text-white">
                Entrar
              </Link>
            </div>
            <p className="text-gray-500 text-sm mt-8">
              © 2024 FitCoachPro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
