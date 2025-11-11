import React, { useState } from 'react';
import { Upload, Download, FileText, FileBarChart, FileClock, FileQuestion, Trash2, FileX, AlertTriangle, Clipboard, Check, ExternalLink } from 'lucide-react';
import { Document, DocumentType, UserRole } from '../types';
import { UploadDocumentModal } from '../components/UploadDocumentModal';
import { supabaseProjectId } from '../supabaseClient';


const STORAGE_POLICIES_SCRIPT = `-- SCRIPT DE POLÍTICAS PARA O BUCKET 'documents'
-- Garante que os usuários possam gerenciar arquivos em suas próprias pastas.

-- ETAPA 1: Remova políticas antigas para uma instalação limpa (Recomendado)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- ETAPA 2: Crie as novas políticas de acesso
-- Política para VISUALIZAR (SELECT): Permite que qualquer pessoa veja os arquivos.
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

-- Política para ENVIAR (INSERT): Permite que um usuário AUTENTICADO envie arquivos para sua própria pasta.
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Política para ATUALIZAR (UPDATE): Permite que um usuário AUTENTICADO atualize arquivos em sua própria pasta.
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Política para EXCLUIR (DELETE): Permite que um usuário AUTENTICADO exclua arquivos de sua própria pasta.
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text );
`;

const StorageInfoPanel: React.FC<{onClose: () => void}> = ({onClose}) => {
  const [copied, setCopied] = useState(false);
  const supabaseSqlUrl = `https://supabase.com/dashboard/project/${supabaseProjectId}/sql/new`;

  const handleCopy = () => {
    navigator.clipboard.writeText(STORAGE_POLICIES_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-lg mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-500" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">Ação Necessária: Corrija as Permissões do Storage</p>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
            <p>O upload falhou porque o Storage do Supabase não tem permissões. Para corrigir, siga estes passos no seu painel Supabase:</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Vá para a seção <strong>Storage</strong>.</li>
                <li>Verifique se existe um "Bucket" chamado <code className="text-xs font-bold bg-yellow-200 dark:bg-yellow-800/50 p-1 rounded">documents</code>. Se não, crie um. <strong>Importante:</strong> Marque a opção "Public bucket".</li>
                <li>Vá para o <strong>SQL Editor</strong>, cole e execute o script abaixo para aplicar as permissões.</li>
            </ol>
            <div className="mt-2 p-2 relative bg-gray-800 dark:bg-gray-900 text-white rounded-md font-mono text-xs overflow-x-auto">
              <pre><code>{STORAGE_POLICIES_SCRIPT}</code></pre>
              <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-all">
                {copied ? <Check size={14} className="text-green-400"/> : <Clipboard size={14} />}
              </button>
            </div>
             <div className="mt-4 flex items-center gap-4">
               <a 
                href={supabaseSqlUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-secondary-700 rounded-md hover:bg-secondary-800"
              >
                <ExternalLink size={14} />
                Abrir Editor SQL do Supabase
              </a>
              <button onClick={onClose} className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:underline">Já corrigi, fechar aviso.</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
        case 'Statute': return <FileText className="text-blue-500" />;
        case 'Meeting Minutes': return <FileClock className="text-purple-500" />;
        case 'Report': return <FileBarChart className="text-green-500" />;
        default: return <FileQuestion className="text-gray-500" />;
    }
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface DocumentsProps {
    documents: Document[];
    onAddDocument: (doc: Omit<Document, 'id'|'url'>, file: File) => Promise<void>;
    onDeleteDocument: (doc: Document) => Promise<void>;
    userRole: UserRole;
}

export const Documents: React.FC<DocumentsProps> = ({ documents, onAddDocument, onDeleteDocument, userRole }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showStorageHelp, setShowStorageHelp] = useState(false);
    const canPerformActions = userRole === 'Super Admin' || userRole === 'Financeiro';

    const handleDelete = async (doc: Document) => {
        if(window.confirm(`Tem certeza que deseja excluir o documento "${doc.name}"?`)) {
            await onDeleteDocument(doc);
        }
    }

    return (
        <>
        <UploadDocumentModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAddDocument={onAddDocument}
            onStorageError={() => setShowStorageHelp(true)}
        />
        <div className="space-y-6">
            {showStorageHelp && <StorageInfoPanel onClose={() => setShowStorageHelp(false)} />}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Repositório de Documentos</h2>
                    {canPerformActions && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary-700 rounded-lg hover:bg-secondary-800">
                            <Upload size={16} /> Carregar Documento
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nome do Arquivo</th>
                                <th scope="col" className="px-6 py-3">Tipo</th>
                                <th scope="col" className="px-6 py-3">Data de Upload</th>
                                <th scope="col" className="px-6 py-3">Tamanho</th>
                                <th scope="col" className="px-6 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.length > 0 ? documents.map((doc) => (
                                <tr key={doc.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center gap-3">
                                        {getDocumentIcon(doc.type)}
                                        {doc.name}
                                    </td>
                                    <td className="px-6 py-4">{doc.type}</td>
                                    <td className="px-6 py-4">{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4">{formatBytes(doc.size)}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <a href={doc.url} download={doc.name} target="_blank" rel="noopener noreferrer" className="p-2 inline-block text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400">
                                            <Download size={18} />
                                        </a>
                                        {canPerformActions && (
                                            <button 
                                                onClick={() => handleDelete(doc)}
                                                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                    <td colSpan={5} className="text-center py-10">
                                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                            <FileX size={48} className="mb-2" />
                                            <h3 className="text-lg font-semibold">Nenhum documento encontrado</h3>
                                            <p className="text-sm">Clique em "Carregar Documento" para adicionar o primeiro.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </>
    );
};