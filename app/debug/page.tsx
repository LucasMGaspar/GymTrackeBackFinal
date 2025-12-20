'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugPage() {
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    
    try {
      // Check session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // Check user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      // Check profile if user exists
      let profileData = null;
      let profileError = null;
      if (userData.user) {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        profileData = result.data;
        profileError = result.error;
      }

      setStatus({
        session: {
          exists: !!sessionData.session,
          data: sessionData.session ? {
            user_id: sessionData.session.user?.id,
            email: sessionData.session.user?.email,
            expires_at: sessionData.session.expires_at,
          } : null,
          error: sessionError?.message,
        },
        user: {
          exists: !!userData.user,
          data: userData.user ? {
            id: userData.user.id,
            email: userData.user.email,
            created_at: userData.user.created_at,
          } : null,
          error: userError?.message,
        },
        profile: {
          exists: !!profileData,
          data: profileData,
          error: profileError?.message,
        },
        env: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET ✓' : 'NOT SET ✗',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET ✓' : 'NOT SET ✗',
        }
      });
    } catch (err: any) {
      setStatus({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const handleCreateProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Nenhum usuário logado');
      return;
    }

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      role: 'student',
      name: user.email?.split('@')[0] || 'User',
    });

    if (error) {
      alert('Erro ao criar perfil: ' + error.message);
    } else {
      alert('Perfil criado com sucesso!');
      window.location.href = '/app/student/today';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔧 Debug de Autenticação</h1>
        
        <div className="space-y-4">
          {/* Environment */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h2 className="font-bold mb-2">Variáveis de Ambiente</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(status.env, null, 2)}
            </pre>
          </div>

          {/* Session */}
          <div className={`rounded-lg p-4 shadow ${status.session?.exists ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h2 className="font-bold mb-2">
              Sessão: {status.session?.exists ? '✅ Ativa' : '❌ Não existe'}
            </h2>
            <pre className="text-sm bg-white/50 p-2 rounded overflow-auto">
              {JSON.stringify(status.session, null, 2)}
            </pre>
          </div>

          {/* User */}
          <div className={`rounded-lg p-4 shadow ${status.user?.exists ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h2 className="font-bold mb-2">
              Usuário: {status.user?.exists ? '✅ Logado' : '❌ Não logado'}
            </h2>
            <pre className="text-sm bg-white/50 p-2 rounded overflow-auto">
              {JSON.stringify(status.user, null, 2)}
            </pre>
          </div>

          {/* Profile */}
          <div className={`rounded-lg p-4 shadow ${status.profile?.exists ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <h2 className="font-bold mb-2">
              Perfil: {status.profile?.exists ? '✅ Existe' : '⚠️ Não existe'}
            </h2>
            <pre className="text-sm bg-white/50 p-2 rounded overflow-auto">
              {JSON.stringify(status.profile, null, 2)}
            </pre>
            
            {status.user?.exists && !status.profile?.exists && (
              <button
                onClick={handleCreateProfile}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Criar Perfil Manualmente
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={checkAuth}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              🔄 Atualizar
            </button>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              🚪 Sair e Limpar
            </button>
            <a
              href="/login"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              🔑 Ir para Login
            </a>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold mb-2">📋 O que verificar:</h3>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li><strong>Variáveis de ambiente</strong> - Devem estar SET ✓</li>
              <li><strong>Sessão</strong> - Se você clicou no link mágico, deve estar ativa</li>
              <li><strong>Usuário</strong> - Deve mostrar seu email</li>
              <li><strong>Perfil</strong> - Se não existe, clique em "Criar Perfil Manualmente"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
