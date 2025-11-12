import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2, AlertTriangle, Clipboard, Check, ExternalLink } from 'lucide-react';
// FIX: The constant is named LOGO_AECC_BASE64. Using an alias for consistency.
import { LOGO_AECC_BASE64 as LOGO_BASE64 } from '../constants';
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
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space