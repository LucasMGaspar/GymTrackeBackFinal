'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Check, Loader2 } from 'lucide-react';

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

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
}

interface Props {
  plans: Plan[];
  currentSubscription: Subscription | null;
  userEmail: string;
}

export function PlansClient({ plans, currentSubscription, userEmail }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [autoCheckoutInProgress, setAutoCheckoutInProgress] = useState(false);
  const checkoutAttemptedRef = useRef(false);

  const formatPrice = (cents: number, currency: string) => {
    const value = cents / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(value);
  };

  const handleSubscribe = useCallback(async (planSlug: string) => {
    setLoading(planSlug);
    setAutoCheckoutInProgress(false); // Hide indicator when starting manual checkout
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_slug: planSlug }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.details || 'Failed to create checkout';
        throw new Error(errorMessage);
      }

      // Redirect to Mercado Pago checkout
      if (data.checkout_url) {
        // Clear states before redirect
        setLoading(null);
        setAutoCheckoutInProgress(false);
        checkoutAttemptedRef.current = false;
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error.message || 'Erro desconhecido ao criar checkout';
      showToast(`Erro ao criar checkout: ${errorMessage}`, 'error');
      setLoading(null);
      setAutoCheckoutInProgress(false);
      
      // Remove checkout parameter from URL to prevent retry loop
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      router.replace(url.pathname + url.search, { scroll: false });
      checkoutAttemptedRef.current = false;
    }
  }, [showToast, router]);

  // Auto-trigger checkout if plan_slug is in URL (from login redirect)
  useEffect(() => {
    const checkoutPlan = searchParams.get('checkout');
    
    // If no checkout param, reset the ref and hide indicator
    if (!checkoutPlan) {
      checkoutAttemptedRef.current = false;
      setAutoCheckoutInProgress(false);
      return;
    }

    // If already attempted, don't try again
    if (checkoutAttemptedRef.current) {
      return;
    }

    // If plans not loaded yet, wait
    if (plans.length === 0) {
      return;
    }

    // If user already has subscription, remove checkout param
    if (currentSubscription) {
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      router.replace(url.pathname + url.search, { scroll: false });
      checkoutAttemptedRef.current = false;
      setAutoCheckoutInProgress(false);
      return;
    }

    // If already loading, don't start another checkout
    if (loading || autoCheckoutInProgress) {
      return;
    }

    const plan = plans.find(p => p.slug === checkoutPlan);
    if (plan) {
      checkoutAttemptedRef.current = true;
      setAutoCheckoutInProgress(true);
      
      // Set a timeout to hide the indicator if checkout takes too long or fails
      const hideIndicatorTimeout = setTimeout(() => {
        setAutoCheckoutInProgress(false);
        checkoutAttemptedRef.current = false;
      }, 8000); // Hide after 8 seconds if still showing
      
      // Longer delay to ensure page is fully loaded and user is authenticated
      const checkoutTimeout = setTimeout(async () => {
        try {
          await handleSubscribe(plan.slug);
          // If successful, handleSubscribe will redirect, so we clear timeout
          clearTimeout(hideIndicatorTimeout);
        } catch (error) {
          // Error already handled in handleSubscribe, just clear timeout
          clearTimeout(hideIndicatorTimeout);
        }
      }, 1500);
      
      // Cleanup timeouts if component unmounts
      return () => {
        clearTimeout(checkoutTimeout);
        clearTimeout(hideIndicatorTimeout);
        setAutoCheckoutInProgress(false);
      };
    }
  }, [searchParams, plans.length, currentSubscription?.id, loading, autoCheckoutInProgress, handleSubscribe, router]);

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId && 
           ['trialing', 'active', 'past_due'].includes(currentSubscription?.status || '');
  };

  const getPlanStatus = (plan: Plan) => {
    if (!currentSubscription) return null;
    if (isCurrentPlan(plan.id)) {
      return currentSubscription.status;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-lg text-gray-600">
            Planos flexíveis para personal trainers de todos os tamanhos
          </p>
          {autoCheckoutInProgress && (
            <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                <span className="text-primary-700 font-medium">
                  Preparando checkout...
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            const status = getPlanStatus(plan);
            const isLoading = loading === plan.slug;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                  isCurrent ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Atual
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
                    <p className="text-sm text-primary-600 font-semibold">
                      {plan.trial_days} dias grátis
                    </p>
                  )}
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      {plan.features.max_students === -1 
                        ? 'Alunos ilimitados' 
                        : `Até ${plan.features.max_students} alunos`}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      {plan.features.max_exercises === -1 
                        ? 'Exercícios ilimitados' 
                        : `Até ${plan.features.max_exercises} exercícios`}
                    </span>
                  </li>
                  {plan.features.whatsapp_notifications && (
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Notificações WhatsApp</span>
                    </li>
                  )}
                  {plan.features.reports && (
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Relatórios detalhados</span>
                    </li>
                  )}
                  {plan.features.api_access && (
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Acesso à API</span>
                    </li>
                  )}
                  {plan.features.priority_support && (
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Suporte prioritário</span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.slug)}
                  disabled={isLoading || isCurrent}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : isLoading
                      ? 'bg-primary-400 text-white cursor-wait'
                      : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </span>
                  ) : isCurrent ? (
                    'Plano Atual'
                  ) : (
                    'Assinar Agora'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

