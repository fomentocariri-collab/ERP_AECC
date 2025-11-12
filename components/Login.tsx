import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2, AlertTriangle, Clipboard, Check, ExternalLink } from 'lucide-react';
import { ERP_NAME } from '../constants';
import { supabaseProjectId } from '../supabaseClient';

const RLS_FIX_SCRIPT = `-- ETAPA 1: Habilite a "Row Level Security" (RLS) para a tabela de perfis.
-- Se já estiver habilitada, este comando não fará nada, mas é essencial garantir.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ETAPA 2: Remova políticas antigas e recursivas para evitar conflitos.
DROP POLICY IF EXISTS "Profiles: Super Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Financeiro view only" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Associado view only" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;

-- ETAPA 3: Crie a política ESSENCIAL que permite a cada usuário ler SEU PRÓPRIO perfil.
-- Esta é a política mais importante para o login funcionar.
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ETAPA 4: Permita que os usuários atualizem seus próprios perfis.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ETAPA 5: (Opcional) Permita que 'Super Admins' vejam TODOS os perfis.
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
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
            <p>O login falhou porque o banco de dados não tem permissões (RLS) para ler o perfil do usuário. Para corrigir, siga estes passos no seu painel Supabase:</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Acesse o painel do seu projeto no Supabase.</li>
                <li>Vá para o <strong>SQL Editor</strong>.</li>
                <li>Copie e execute o script abaixo para aplicar as permissões corretas.</li>
            </ol>
            <div className="mt-2 p-2 relative bg-gray-800 dark:bg-gray-900 text-white rounded-md font-mono text-xs overflow-x-auto">
              <pre><code>{RLS_FIX_SCRIPT}</code></pre>
              <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-all">
                {copied ? <Check size={14} className="text-green-400"/> : <Clipboard size={14} />}
              </button>
            </div>
             <div className="mt-4">
               <a 
                href={supabaseSqlUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-secondary-700 rounded-md hover:bg-secondary-800"
              >
                <ExternalLink size={14} />
                Abrir Editor SQL do Supabase
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRLSHelp, setShowRLSHelp] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowRLSHelp(false);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      console.error(err);
      if(err.message === "RLS_RECURSION") {
        setShowRLSHelp(true);
      }
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full">
            <div className="text-center mb-8">
                <h1 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                    {ERP_NAME}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Bem-vindo! Acesse seu painel de gerenciamento.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-secondary-500 focus:border-secondary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-secondary-500 focus:border-secondary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>
                    
                    {error && !showRLSHelp && <p className="text-sm text-red-500">{error}</p>}
                    
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary-700 hover:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <LogIn size={20}/>}
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
             {showRLSHelp && <RLSInfoPanel />}
        </div>
    </div>
  );
};