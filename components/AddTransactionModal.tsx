import React, { useState, useEffect } from 'react';
import { Transaction, Member } from '../types';
import { X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

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

  useEffect(() => { if (isOpen) { setDescription(''); setAmount(''); setType('Income'); setDate(new Date().toISOString().split('T')[0]); setLinkType('None'); setSelectedId(''); setError(''); setIsSaving(false); } }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) { setError('Campos obrigatórios faltando.'); return; }
    if (linkType !== 'None' && !selectedId) { setError('Selecione o item vinculado.'); return; }
    setError(''); setIsSaving(true);
    const tData: Omit<Transaction, 'id'> = { description, amount: parseFloat(amount), type, date };
    if (linkType === 'Member') { tData.memberId = selectedId; tData.memberName = members.find(m => m.id === selectedId)?.name; }
    else if (linkType === 'Project') { tData.projectId = selectedId; tData.projectName = projects.find(p => p.id === selectedId)?.title; }
    else if (linkType === 'Provider') { tData.providerId = selectedId; tData.providerName = providers.find(p => p.id === selectedId)?.name; }
    await onAddTransaction(tData); setIsSaving(false); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold">Nova Transação</h2><button onClick={onClose}><X size={20} /></button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm">Tipo</label><select value={type} onChange={(e) => setType(e.target.value as any)} className={INPUT_CLASS}><option value="Income">Receita</option><option value="Expense">Despesa</option></select></div>
                <div><label className="block text-sm">Descrição</label><input value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT_CLASS} /></div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border dark:border-gray-600">
                <label className="block text-sm mb-2">Vincular a:</label>
                <select value={linkType} onChange={(e) => { setLinkType(e.target.value as any); setSelectedId(''); }} className={INPUT_CLASS}>
                    <option value="None">Sem Vínculo</option><option value="Member">Associado</option><option value="Project">Projeto</option><option value="Provider">Prestador</option>
                </select>
                {linkType !== 'None' && (
                    <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={`${INPUT_CLASS} mt-2`}>
                        <option value="">Selecione...</option>
                        {linkType === 'Member' && members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        {linkType === 'Project' && projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        {linkType === 'Provider' && providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm">Valor (R$)</label><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={INPUT_CLASS} /></div>
                <div><label className="block text-sm">Data</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT_CLASS} /></div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-secondary-700 text-white rounded-lg">Salvar</button></div>
        </form>
      </div>
    </div>
  );
};