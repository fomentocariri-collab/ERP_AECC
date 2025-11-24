import React, { useState } from 'react';
import { Clipboard, Check, Database } from 'lucide-react';
import { supabaseProjectId } from '../supabaseClient';

const MIGRATION_SQL = `
-- TABELA PROJETOS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL CHECK (status IN ('Planning', 'Active', 'Completed', 'Cancelled')),
    proponent TEXT NOT NULL,
    sponsor TEXT NOT NULL,
    budget NUMERIC(10, 2) DEFAULT 0
);

-- TABELA PRESTADORES DE SERVIÇO
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Artist', 'Workshop Facilitator', 'Designer', 'Consultant', 'Other')),
    email TEXT,
    phone TEXT,
    cpf_cnpj TEXT,
    portfolio_url TEXT,
    notes TEXT
);

-- TABELA PATRIMÔNIO (INVENTORY)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    acquisition_date DATE NOT NULL,
    value NUMERIC(10, 2) DEFAULT 0,
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Good', 'Fair', 'Poor', 'Broken')),
    location TEXT NOT NULL,
    description TEXT
);

-- ATUALIZAÇÃO DA TABELA DE TRANSAÇÕES (FKs)
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

-- HABILITAR RLS (Segurança)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO (Simples: Todos autenticados podem ler/escrever)
-- Ajuste conforme necessidade de permissões mais restritas
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
        <div className="mt-8 p-6 bg-slate-800 text-slate-200 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
                <Database className="text-blue-400" /> Atualização do Banco de Dados Necessária
            </h3>
            <p className="text-sm mb-4 text-slate-300">
                Para que as novas funcionalidades (Projetos, Prestadores e Patrimônio) funcionem, você precisa criar as tabelas no Supabase.
            </p>
            <div className="relative bg-slate-950 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 max-h-64 overflow-y-auto">
                <pre>{MIGRATION_SQL}</pre>
                <button 
                    onClick={handleCopy} 
                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-white transition-all flex items-center gap-2"
                >
                    {copied ? <Check size={14} className="text-green-400"/> : <Clipboard size={14} />}
                    {copied ? 'Copiado!' : 'Copiar SQL'}
                </button>
            </div>
            <div className="mt-4 text-right">
                <a 
                    href={supabaseSqlUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Abrir SQL Editor do Supabase
                </a>
            </div>
        </div>
    );
}