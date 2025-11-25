import React, { useState } from 'react';
import { Clipboard, Check, Database, ExternalLink } from 'lucide-react';
import { supabaseProjectId } from '../supabaseClient';

const MIGRATION_SQL = `-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR

-- 1. TABELA DE PROJETOS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL CHECK (status IN ('Planning', 'Active', 'Completed', 'Cancelled')),
    proponent TEXT NOT NULL,
    sponsor TEXT NOT NULL,
    budget NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE PRESTADORES DE SERVIÇO
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Artist', 'Workshop Facilitator', 'Designer', 'Consultant', 'Other')),
    email TEXT,
    phone TEXT,
    cpf_cnpj TEXT,
    portfolio_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE PATRIMÔNIO (INVENTORY)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    acquisition_date DATE NOT NULL,
    value NUMERIC(10, 2) DEFAULT 0,
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Good', 'Fair', 'Poor', 'Broken')),
    location TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ATUALIZAR TRANSAÇÕES (Adicionar colunas de vínculo)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'project_id') THEN
        ALTER TABLE public.transactions ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
        ALTER TABLE public.transactions ADD COLUMN project_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'provider_id') THEN
        ALTER TABLE public.transactions ADD COLUMN provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL;
        ALTER TABLE public.transactions ADD COLUMN provider_name TEXT;
    END IF;
END $$;

-- 5. HABILITAR SEGURANÇA (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS DE ACESSO (Permitir leitura/escrita para usuários autenticados)
CREATE POLICY "Enable all for authenticated users on projects" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users on providers" ON public.service_providers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users on inventory" ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

export const DatabaseSchemaHelp: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const supabaseSqlUrl = `https://supabase.com/dashboard/project/${supabaseProjectId}/sql/new`;
  
    const handleCopy = () => {
      navigator.clipboard.writeText(MIGRATION_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mt-8 p-6 bg-slate-800 text-slate-200 rounded-xl border border-slate-700 shadow-xl">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-white">
                <Database className="text-blue-400" /> Banco de Dados: Script de Migração
            </h3>
            <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-4 text-sm text-blue-200">
                <strong>Importante:</strong> Para que as abas de Projetos, Prestadores e Patrimônio funcionem, você precisa criar as tabelas no Supabase.
            </div>
            <div className="relative bg-slate-950 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 max-h-96 overflow-y-auto custom-scrollbar">
                <pre>{MIGRATION_SQL}</pre>
                <button 
                    onClick={handleCopy} 
                    className="absolute top-2 right-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold transition-all flex items-center gap-2 shadow-lg"
                >
                    {copied ? <Check size={14} className="text-white"/> : <Clipboard size={14} />}
                    {copied ? 'Copiado!' : 'Copiar Script'}
                </button>
            </div>
            <div className="mt-6 text-right">
                <a 
                    href={supabaseSqlUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                    <ExternalLink size={16} />
                    Abrir SQL Editor e Executar
                </a>
            </div>
        </div>
    );
}