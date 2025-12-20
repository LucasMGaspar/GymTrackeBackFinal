'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dumbbell, Mail, ArrowRight, Sparkles, Shield, Zap, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

// Traduz mensagens de erro do Supabase
function translateError(error: string): string {
  const errorMap: Record<string, string> = {
    'For security purposes, you can only request this after': 'Por segurança, aguarde antes de solicitar um novo link.',
    'Email rate limit exceeded': 'Limite de emails atingido. Aguarde alguns minutos.',
    'Invalid email': 'Email inválido.',
    'User not found': 'Usuário não encontrado.',
    'Email not confirmed': 'Email não confirmado.',
    'Invalid login credentials': 'Credenciais inválidas.',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) return value;
  }
  
  return error;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Check for stored cooldown on mount
  useEffect(() => {
    const stored = localStorage.getItem('loginCooldown');
    if (stored) {
      const remaining = Math.max(0, Math.floor((parseInt(stored) - Date.now()) / 1000));
      if (remaining > 0) {
        setCooldown(remaining);
      } else {
        localStorage.removeItem('loginCooldown');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldown > 0) {
      setMessage({
        type: 'warning',
        text: `Aguarde ${cooldown} segundos antes de solicitar um novo link.`,
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Set cooldown for 60 seconds
      const cooldownEnd = Date.now() + 60000;
      localStorage.setItem('loginCooldown', cooldownEnd.toString());
      setCooldown(60);

      setMessage({
        type: 'success',
        text: 'Link mágico enviado! Verifique seu email (incluindo a pasta de spam).',
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao enviar link mágico.';
      
      // Check if it's a rate limit error and extract seconds
      const secondsMatch = errorMessage.match(/after (\d+) seconds/);
      if (secondsMatch) {
        const seconds = parseInt(secondsMatch[1]);
        setCooldown(seconds);
        localStorage.setItem('loginCooldown', (Date.now() + seconds * 1000).toString());
      }

      setMessage({
        type: 'error',
        text: translateError(errorMessage),
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, text: 'Acesso instantâneo' },
    { icon: Shield, text: 'Seguro e sem senha' },
    { icon: Sparkles, text: 'Experiência premium' },
  ];

  const isDisabled = loading || cooldown > 0;

  return (
    <div className="min-h-screen mesh-gradient flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero-alt p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">FitPro</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Transforme seus treinos em resultados reais
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            A plataforma completa para personal trainers e alunos acompanharem a evolução de cada treino.
          </p>
          
          <div className="flex flex-col gap-3 pt-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white/90">
                <div className="bg-white/20 p-2 rounded-lg">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © 2024 FitPro. Todos os direitos reservados.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="gradient-hero-alt p-3 rounded-2xl">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">FitPro</span>
          </div>

          <div className="card shadow-soft-xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Bem-vindo de volta!
              </h2>
              <p className="text-gray-500">
                Entre com seu email para acessar sua conta
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    className="input pl-12"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isDisabled}
                className="btn-primary w-full py-4 text-base"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Enviando...</span>
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <Clock className="w-5 h-5" />
                    <span>Aguarde {cooldown}s</span>
                  </>
                ) : (
                  <>
                    <span>Enviar link mágico</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {message && (
              <div
                className={`mt-6 p-4 rounded-xl flex items-start gap-3 animate-slide-up ${
                  message.type === 'success'
                    ? 'bg-success-50 text-success-700 border border-success-200'
                    : message.type === 'warning'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : message.type === 'warning' ? (
                  <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <p>Acesso seguro e sem senha via link mágico</p>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-success-500" />
              256-bit SSL
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-success-500" />
              LGPD Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
