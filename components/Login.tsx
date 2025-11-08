import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2, AlertTriangle, Clipboard, Check, ExternalLink } from 'lucide-react';
import { LOGO_BASE64 } from '../constants';
import { supabaseProjectId } from '../src/lib/supabaseClient.js';

const RLS_FIX_SCRIPT = `-- ETAPA 1: Remova políticas antigas e recursivas.
DROP POLICY IF EXISTS "Profiles: Super Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Financeiro view only" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Associado view only" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;

-- ETAPA 2: Crie a política ESSENCIAL que permite a cada usuário ler SEU PRÓPRIO perfil.
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ETAPA 3: Permita que os usuários atualizem seus próprios perfis.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ETAPA 4: (Opcional) Permita que 'Super Admins' vejam TODOS os perfis.
CREATE POLICY "Super Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Super Admin' );`;

const RLSInfoPanel: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const supabaseSqlUrl = `https://supabase.com/dashboard/project/${supabaseProjectId}/sql/new`;

  const handleCopy = () => {
    navigator.clipboard.writeText(RLS_FIX_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-lg mt-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-500" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">Ação Necessária: Corrija as Permissões do Banco de Dados</p>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>O login falhou devido a um erro de permissão (RLS) no Supabase. Para corrigir, copie o script abaixo e execute-o no Editor SQL do seu projeto.</p>
            <div className="mt-2 p-2 relative bg-gray-800 dark:bg-gray-900 text-white rounded-md font-mono text-xs overflow-x-auto">
              <pre><code>{RLS_FIX_SCRIPT}</code></pre>
              <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-all">
                {copied ? <Check size={14} className="text-green-400"/> : <Clipboard size={14} />}
              </button>
            </div>
             <div className="mt-4 flex gap-2">
               <a 
                href={supabaseSqlUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-primary-700 rounded-md hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ExternalLink size={14} />
                Abrir Editor SQL
              </a>
            </div>
            {supabaseProjectId ? 
                <p className="mt-2 text-xs">Isso abrirá uma nova aba para o Editor SQL. Cole o script e clique em "RUN".</p> 
                : <p className="mt-2 text-xs text-yellow-500">Não foi possível gerar o link direto. Acesse o Editor SQL no painel do Supabase manualmente.</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
};


export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const [showRlsHelp, setShowRlsHelp] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setShowRlsHelp(false);
        try {
            await login(email, password);
        } catch (err: any) {
            if (err.message === 'RLS_RECURSION') {
                setShowRlsHelp(true);
                setError("O login foi bloqueado por uma política de segurança (RLS) mal configurada.");
            } else {
                setError(err.message || 'Ocorreu um erro ao fazer login.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-primary-100 dark:from-gray-900 dark:to-primary-950/50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="text-center space-y-2">
                    {LOGO_BASE64 !== "[PLACEHOLDER_LOGO]" && 
                        <img src={LOGO_BASE64} alt="Logo" className="mx-auto w-40 mb-4" />
                    }
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Acessar a Plataforma
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Bem-vindo(a) de volta!
                    </p>
                </div>

                {showRlsHelp && <RLSInfoPanel />}

                <form className="mt-6 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 placeholder-gray-500 text-gray-900 dark:text-gray-200 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="Email"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 placeholder-gray-500 text-gray-900 dark:text-gray-200 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="Senha"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error && !showRlsHelp && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300 text-center">{error}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                {loading ? (
                                    <Loader2 className="h-5 w-5 text-primary-300 animate-spin" />
                                ) : (
                                    <LogIn className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
                                )}
                            </span>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};