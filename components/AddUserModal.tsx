import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { X } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: { name: string; email: string; role: UserRole; password?: string; }) => Promise<void>;
  existingUser?: User | null;
}

const roles: UserRole[] = ['Super Admin', 'Financeiro', 'Associado'];
const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-primary-500 dark:focus:ring-primary-500";


export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSave, existingUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Associado');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!existingUser;

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('Associado');
    setError('');
    setIsSaving(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (isEditing && existingUser) {
          setName(existingUser.name);
          setEmail(existingUser.email);
          setRole(existingUser.role);
          setPassword('');
        } else {
          resetForm();
        }
    }
  }, [isOpen, existingUser, isEditing, resetForm]);


  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!isEditing && !password)) {
      setError('Nome, Email e Senha são obrigatórios para novos usuários.');
      return;
    }
    setError('');
    setIsSaving(true);

    const userData = { name, email, role, ...(password && { password }) };
    
    try {
        await onSave(userData);
        onClose();
    } catch (e) {
        console.error("Failed to save user", e);
        setError((e as Error).message || "Ocorreu um erro desconhecido.");
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
          <h2 className="text-xl font-semibold">{isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                <input type="text" id="userName" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} required />
              </div>
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" id="userEmail" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                <label htmlFor="userPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                <input type="password" id="userPassword" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLASS} placeholder={isEditing ? 'Deixe em branco para não alterar' : ''} required={!isEditing} />
              </div>
              <div>
                <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Perfil de Acesso</label>
                <select id="userRole" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={INPUT_CLASS}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
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
              {isSaving ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};