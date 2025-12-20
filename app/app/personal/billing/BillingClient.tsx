'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Loader2, CheckCircle2, XCircle, Clock, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  interval: 'month' | 'year';
  features: Record<string, any>;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  plan: Plan;
}

interface Props {
  subscription: Subscription | null;
  userEmail: string;
}

function BillingClientContent({ subscription: initialSubscription, userEmail }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState(initialSubscription);
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Check for status from checkout redirect
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      showToast('Checkout realizado com sucesso! Verificando status...', 'success');
      // Refresh subscription data
      fetchSubscription();
    }
  }, [searchParams]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing/subscription');
      const data = await response.json();
      if (response.ok) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (immediate: boolean = false) => {
    if (!confirm(
      immediate 
        ? 'Tem certeza que deseja cancelar imediatamente? Você perderá o acesso agora.'
        : 'Tem certeza que deseja cancelar a assinatura? Ela será cancelada ao fim do período atual.'
    )) {
      return;
    }

    setCanceling(true);
    try {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      showToast(
        immediate 
          ? 'Assinatura cancelada imediatamente' 
          : 'Assinatura será cancelada ao fim do período',
        'success'
      );
      
      fetchSubscription();
    } catch (error: any) {
      console.error('Cancel error:', error);
      showToast('Erro ao cancelar: ' + error.message, 'error');
    } finally {
      setCanceling(false);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    const value = cents / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { icon: CheckCircle2, color: 'text-green-600 bg-green-50', text: 'Ativa' },
      trialing: { icon: Clock, color: 'text-blue-600 bg-blue-50', text: 'Período de Teste' },
      past_due: { icon: XCircle, color: 'text-yellow-600 bg-yellow-50', text: 'Pagamento Pendente' },
      pending: { icon: Clock, color: 'text-gray-600 bg-gray-50', text: 'Pendente' },
      canceled: { icon: XCircle, color: 'text-red-600 bg-red-50', text: 'Cancelada' },
      paused: { icon: Clock, color: 'text-gray-600 bg-gray-50', text: 'Pausada' },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  if (loading && !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhuma Assinatura Ativa
            </h2>
            <p className="text-gray-600 mb-6">
              Você ainda não possui uma assinatura ativa. Escolha um plano para começar.
            </p>
            <Link
              href="/app/personal/plans"
              className="inline-block bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition"
            >
              Ver Planos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const plan = subscription.plan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Faturamento
              </h1>
              <p className="text-gray-600">
                Gerencie sua assinatura e pagamentos
              </p>
            </div>
            {getStatusBadge(subscription.status)}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-6">
            {/* Current Plan */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Plano Atual
              </h3>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </span>
                  <span className="text-xl font-semibold text-gray-700">
                    {formatPrice(plan.price_cents, plan.currency)}
                    <span className="text-sm text-gray-500 ml-1">
                      /{plan.interval === 'month' ? 'mês' : 'ano'}
                    </span>
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                {subscription.trial_end && new Date(subscription.trial_end) > new Date() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Período de teste:</strong> Até {formatDate(subscription.trial_end)}
                    </p>
                  </div>
                )}

                {subscription.current_period_end && (
                  <p className="text-sm text-gray-600">
                    {subscription.cancel_at_period_end 
                      ? `Cancelamento agendado para ${formatDate(subscription.current_period_end)}`
                      : `Próxima cobrança: ${formatDate(subscription.current_period_end)}`
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {!subscription.cancel_at_period_end && subscription.status !== 'canceled' && (
                <>
                  <button
                    onClick={() => handleCancel(false)}
                    disabled={canceling}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {canceling ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </span>
                    ) : (
                      'Cancelar ao Fim do Período'
                    )}
                  </button>
                  <button
                    onClick={() => handleCancel(true)}
                    disabled={canceling}
                    className="flex-1 bg-red-50 text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-100 transition disabled:opacity-50"
                  >
                    Cancelar Imediatamente
                  </button>
                </>
              )}
              <Link
                href="/app/personal/plans"
                className="flex-1 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition text-center"
              >
                Trocar Plano
              </Link>
            </div>
          </div>
        </div>

        {/* Billing Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informações de Faturamento
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="text-gray-900 font-medium">{userEmail}</span>
            </div>
            {subscription.current_period_start && (
              <div className="flex justify-between">
                <span className="text-gray-600">Período atual iniciado em:</span>
                <span className="text-gray-900 font-medium">
                  {formatDate(subscription.current_period_start)}
                </span>
              </div>
            )}
            {subscription.current_period_end && (
              <div className="flex justify-between">
                <span className="text-gray-600">Próxima cobrança:</span>
                <span className="text-gray-900 font-medium">
                  {formatDate(subscription.current_period_end)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BillingClient(props: Props) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    }>
      <BillingClientContent {...props} />
    </Suspense>
  );
}

