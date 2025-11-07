import React, { useState } from 'react';
import { Document, DocumentType } from '../types';
import { X, UploadCloud } from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (document: Omit<Document, 'id'|'url'>, file: File) => Promise<void>;
}

const documentTypes: DocumentType[] = ['Statute', 'Meeting Minutes', 'Report', 'Other'];
const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-primary-500 dark:focus:ring-primary-500";


export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({ isOpen, onClose, onAddDocument }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>('Report');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setSelectedFile(null);
    setDocType('Report');
    setError('');
    setIsSaving(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Por favor, selecione um arquivo para carregar.');
      return;
    }
    setError('');
    setIsSaving(true);
    
    const newDocumentData = {
        name: selectedFile.name,
        type: docType,
        uploadDate: new Date().toISOString(),
        size: selectedFile.size,
    };

    try {
        await onAddDocument(newDocumentData, selectedFile);
        resetForm();
        onClose();
    } catch (e) {
        console.error(e)
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Carregar Novo Documento</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="docType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Documento</label>
              <select id="docType" value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)} className={INPUT_CLASS}>
                {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Arquivo</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-700 dark:text-primary-400 hover:text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Selecione um arquivo</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">ou arraste e solte aqui</p>
                  </div>
                  {selectedFile ? (
                    <p className="text-sm text-gray-500 dark:text-gray-300">{selectedFile.name}</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF, DOCX, etc.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-6 border-t dark:border-gray-700 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:bg-primary-400 disabled:cursor-wait"
            >
              {isSaving ? 'Salvando...' : 'Salvar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};