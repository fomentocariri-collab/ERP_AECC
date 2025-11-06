import React, { useState } from 'react';
import { Upload, Download, FileText, FileBarChart, FileClock, FileQuestion, Trash2, FileX } from 'lucide-react';
import { Document, DocumentType, UserRole } from '../types';
import { UploadDocumentModal } from '../components/UploadDocumentModal';

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
        />
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Repositório de Documentos</h2>
                {canPerformActions && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800">
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
                                            className="p-2 text-gray-500 hover:text-primary-700 dark:text-gray-400 dark:hover:text-primary-500">
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
        </>
    );
};