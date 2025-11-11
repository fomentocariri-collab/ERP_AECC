import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, Member } from '../types';
import { X } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  members: Member[];
}

const MEMBER_RELATED_DESCRIPTIONS = ['Mensalidade', 'Taxa Novo Associado', 'Multa'];
const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-primary-500 dark:focus:ring-primary-500";


export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAddTransaction, members }) => {
  const [description, setDescription] = useState('Mensalidade');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [memberId, setMemberId] = useState<string>('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const showMemberSelector = MEMBER_RELATED_DESCRIPTIONS.includes(description);
  
  const resetForm = useCallback(() => {
    setDescription('Mensalidade');
    setAmount('');
    setType('Income');
    setDate(new Date().toISOString().split('T')[0]);
    setMemberId('');
    setError('');
    setIsSaving(false);
  }, []);
  
  useEffect(() => {
    if(isOpen) {
        resetForm();
    }
  }, [isOpen, resetForm]);
  
  useEffect(() => {
    if (!showMemberSelector) {
        setMemberId('');
    }
  }, [description, showMemberSelector]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) {
      setError('Descrição, Valor e Data são obrigatórios.');
      return;
    }
    if (showMemberSelector && !memberId) {
        setError('Por favor, selecione um membro.');
        return;
    }
    setError('');
    setIsSaving(true);

    const selectedMember = members.find(m => m.id === memberId);

    try {
        await onAddTransaction({
          description,
          amount: parseFloat(amount),
          type,
          date,
          memberId: showMemberSelector ? memberId : undefined,
          memberName: showMemberSelector ? selectedMember?.name : undefined,
        });
        onClose();
    } catch(e) {
        console.error("Failed to add transaction", e);
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
          <h2 className="text-xl font-semibold">Adicionar Nova Transação</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                <select id="type" value={type} onChange={(e) => setType(e.target.value as 'Income' | 'Expense')} className={INPUT_CLASS}>
                  <option value="Income">Receita</option>
                  <option value="Expense">Despesa</option>
                </select>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <select id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT_CLASS}>
                  <option>Mensalidade</option>
                  <option>Taxa Novo Associado</option>
                  <option>Multa</option>
                  <option>Doação</option>
                  <option>Venda de Produtos</option>
                  <option>Aluguel</option>
                  <option>Salários</option>
                  <option>Contas (Água, Luz, etc.)</option>
                  <option>Outro</option>
                </select>
              </div>
            </div>

            {showMemberSelector && (
              <div>
                <label htmlFor="memberId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Associado</label>
                <select id="memberId" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={INPUT_CLASS} required>
                    <option value="" disabled>Selecione um membro...</option>
                    {members.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$)</label>
                    <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={INPUT_CLASS} step="0.01" placeholder="0.00" required/>
                </div>
                 <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data</label>
                    <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT_CLASS} required/>
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
              {isSaving ? 'Salvando...' : 'Salvar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
