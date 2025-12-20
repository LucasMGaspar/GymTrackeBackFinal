'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  interval: 'month' | 'year';
  trial_days: number | null;
  features: {
    max_students?: number;
    max_exercises?: number;
    whatsapp_notifications?: boolean;
    reports?: boolean;
    api_access?: boolean;
    priority_support?: boolean;
  };
}

interface Props {
  plans: Plan[];
}

export function PlansPublicClient({ plans }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const formatPrice = (cents: number, currency: string) => {
    const value = cents / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(value);
  };

  const handleSubscribe = (planSlug: string) => {
    // Redirect to login with plan_slug parameter
    // After login, user will be redirected to checkout
    router.push(`/login?plan_slug=${planSlug}&redirect_to=/app/personal/plans`);
  };

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
                href="/login"
                className="text-gray-700 hover:text-primary-600 font-medium"
              >
                Entrar
              </Link>
              <Link
                href="/login"
                className="bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Planos flexíveis para personal trainers
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Gerencie seus alunos, crie treinos personalizados e acompanhe o progresso de cada um.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan) => {
            const isLoading = loading === plan.slug;
            const isPopular = plan.slug === 'pro-monthly';

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-lg p-8 relative transition-all hover:shadow-2xl ${
                  isPopular ? 'ring-2 ring-primary-500 scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price_cents, plan.currency)}
                    </span>
                    <span className="text-gray-600 ml-2">
                      /{plan.interval === 'month' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  {plan.trial_days && (
                    <p className="text-sm text-primary-600 font-semibold mb-2">
                      {plan.trial_days} dias grátis
                    </p>
                  )}
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8 min-h-[200px]">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">
                      {plan.features.max_students === -1 
                        ? 'Alunos ilimitados' 
                        : `Até ${plan.features.max_students} alunos`}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">
                      {plan.features.max_exercises === -1 
                        ? 'Exercícios ilimitados' 
                        : `Até ${plan.features.max_exercises} exercícios`}
                    </span>
                  </li>
                  {plan.features.whatsapp_notifications && (
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Notificações WhatsApp</span>
                    </li>
                  )}
                  {plan.features.reports && (
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Relatórios detalhados</span>
                    </li>
                  )}
                  {plan.features.api_access && (
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Acesso à API</span>
                    </li>
                  )}
                  {plan.features.priority_support && (
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">Suporte prioritário</span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.slug)}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center ${
                    isLoading
                      ? 'bg-primary-400 text-white cursor-wait'
                      : isPopular
                      ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Assinar Agora
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Perguntas Frequentes
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Como funciona o período de teste?
              </h3>
              <p className="text-gray-600">
                Você pode testar os planos Pro e Business gratuitamente pelos dias indicados. Não é necessário cartão de crédito.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Posso mudar de plano depois?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são aplicadas imediatamente.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quais formas de pagamento são aceitas?
              </h3>
              <p className="text-gray-600">
                Aceitamos cartão de crédito, débito e PIX através do Mercado Pago. Pagamentos são processados de forma segura.
              </p>
            </div>
          </div>
        </div>
      </div>

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

