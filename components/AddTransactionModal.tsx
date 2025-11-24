import React, { useState, useEffect } from 'react';
import { Transaction, Member, Project, ServiceProvider } from '../types';
import { X } from 'lucide-react';
import { useData } from '../contexts/DataContext'; // Importando para ter acesso a projetos e prestadores

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  members: Member[];
}

const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary-500 focus:ring-secondary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-secondary-500 dark:focus:ring-secondary-500";

type LinkType = 'Member' | 'Project' | 'Provider' | 'None';

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAddTransaction, members }) => {
  const { projects, providers } = useData();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [linkType, setLinkType] = useState<LinkType>('None');
  const [selectedId, setSelectedId] = useState<string>('');

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
        resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType('Income');
    setDate(new Date().toISOString().split('T')[0]);
    setLinkType('None');
    setSelectedId('');
    setError('');
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) {
      setError('Descrição, Valor e Data são obrigatórios.');
      return;
    }
    if (linkType !== 'None' && !selectedId) {
        setError('Selecione o item vinculado.');
        return;
    }

    setError('');
    setIsSaving(true);

    const transactionData: Omit<Transaction, 'id'> = {
      description,
      amount: parseFloat(amount),
      type,
      date,
    };

    if (linkType === 'Member') {
        const member = members.find(m => m.id === selectedId);
        transactionData.memberId = selectedId;
        transactionData.memberName = member?.name;
    } else if (linkType === 'Project') {
        const project = projects.find(p => p.id === selectedId);
        transactionData.projectId = selectedId;
        transactionData.projectName = project?.title;
    } else if (linkType === 'Provider') {
        const provider = providers.find(p => p.id === selectedId);
        transactionData.providerId = selectedId;
        transactionData.providerName = provider?.name;
    }

    await onAddTransaction(transactionData);
    
    setIsSaving(false);
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Adicionar Nova Transação</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                <select value={type} onChange={(e) => setType(e.target.value as 'Income' | 'Expense')} className={INPUT_CLASS}>
                  <option value="Income">Receita</option>
                  <option value="Expense">Despesa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT_CLASS} placeholder="Ex: Pagamento Serviço" />
              </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vincular a:</label>
                <select value={linkType} onChange={(e) => { setLinkType(e.target.value as LinkType); setSelectedId(''); }} className={INPUT_CLASS}>
                    <option value="None">Sem Vínculo Específico</option>
                    <option value="Member">Associado (Mensalidades, etc)</option>
                    <option value="Project">Projeto (Custos do projeto)</option>
                    <option value="Provider">Prestador de Serviço (Pagamentos)</option>
                </select>
            </div>

            {linkType === 'Member' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione o Associado</label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={INPUT_CLASS} required>
                    <option value="" disabled>Selecione...</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}
            
            {linkType === 'Project' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione o Projeto</label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={INPUT_CLASS} required>
                    <option value="" disabled>Selecione...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            )}

            {linkType === 'Provider' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione o Prestador</label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={INPUT_CLASS} required>
                    <option value="" disabled>Selecione...</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={INPUT_CLASS} step="0.01" placeholder="0.00" required/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT_CLASS} required/>
                </div>
            </div>
            
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-6 border-t dark:border-gray-700 mt-4">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-secondary-700 rounded-lg hover:bg-secondary-800 disabled:bg-secondary-400 disabled:cursor-wait">{isSaving ? 'Salvando...' : 'Salvar Transação'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};