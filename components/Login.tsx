import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2, AlertTriangle, Clipboard, Check, ExternalLink, HelpCircle } from 'lucide-react';
import { ERP_NAME } from '../constants';
import { supabaseProjectId } from '../supabaseClient';

const RECOVERY_SCRIPT = `-- SCRIPT DE RECUPERAÇÃO DE LOGIN E PERFIS
-- Execute este script no SQL Editor do Supabase para corrigir o acesso.

-- 1. Cria a tabela de perfis se ela sumiu na restauração
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'Associado',
  avatar_url TEXT
);

-- 2. Sincroniza usuários do sistema de Autenticação para a tabela pública (CRÍTICO APÓS RESTAURAÇÃO)
-- Isso pega usuários que estão no Auth mas não no banco de dados público
INSERT INTO public.profiles (id, email, name, role, avatar_url)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', email),
  COALESCE(raw_user_meta_data->>'role', 'Associado'),
  COALESCE(raw_user_meta_data->>'avatar_url', 'https://i.pravatar.cc/150?u=' || email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 3. Habilita segurança (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Super Admin full access" ON public.profiles;

-- 5. Cria políticas de acesso corretas
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Super Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Super Admin' );

-- 6. DICA: Se seu usuário Admin virou 'Associado', execute manualmente:
-- UPDATE public.profiles SET role = 'Super Admin' WHERE email = 'SEU_EMAIL_AQUI';
`;

const RLSInfoPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const supabaseSqlUrl = `https://supabase.com/dashboard/project/${supabaseProjectId}/sql/new`;

  const handleCopy = () => {
    navigator.clipboard.writeText(RECOVERY_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-start bg-yellow-50 dark:bg-yellow-900/20 rounded-t-xl">
            <div className="flex gap-4">
                <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-800 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recuperação de Acesso ao Banco de Dados</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Se houve uma restauração no Supabase, as tabelas de perfil podem ter se perdido ou desconectado.
                        Este script irá recriar a tabela e ressincronizar seus usuários.
                    </p>
                </div>
            </div>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <span className="sr-only">Fechar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 dark:bg-gray-900">
             <ol className="list-decimal list-inside space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
                <li>Copie o código abaixo.</li>
                <li>Vá para o <strong>SQL Editor</strong> no seu painel Supabase.</li>
                <li>Cole e clique em <strong>Run</strong>.</li>
                <li>Tente fazer login novamente.</li>
            </ol>
            <div className="relative group">
              <div className="absolute top-2 right-2 flex gap-2">
                 <button onClick={handleCopy} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm transition-all flex items-center gap-2 text-xs font-bold">
                    {copied ? <Check size={14}/> : <Clipboard size={14} />}
                    {copied ? 'COPIADO' : 'COPIAR SQL'}
                  </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-50 rounded-lg font-mono text-xs overflow-x-auto border border-slate-700 shadow-inner">
                <code>{RECOVERY_SCRIPT}</code>
              </pre>
            </div>
        </div>

        <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl flex justify-between items-center">
             <a 
                href={supabaseSqlUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
              >
                <ExternalLink size={16} />
                Abrir Supabase SQL Editor
              </a>
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                Fechar
              </button>
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
  const [showHelp, setShowHelp] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      console.error(err);
      // Mostra o help automaticamente se for erro de RLS, mas o botão manual também existe
      if(err.message === "RLS_RECURSION" || err.message.includes("Perfil")) {
        setShowHelp(true);
      }
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    {showHelp && <RLSInfoPanel onClose={() => setShowHelp(false)} />}
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

            <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
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
                    
                    {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">{error}</div>}
                    
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary-700 hover:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <LogIn size={20}/>}
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                   <button 
                     type="button"
                     onClick={() => setShowHelp(true)}
                     className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center justify-center gap-1 mx-auto"
                   >
                     <HelpCircle size={14} />
                     Problemas para entrar? Clique aqui.
                   </button>
                </div>
            </div>
        </div>
    </div>
    </>
  );
};