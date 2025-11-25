import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { PlusCircle, Edit, Trash2, Shield, Database } from 'lucide-react';
import { AddUserModal } from '../components/AddUserModal';
import { DatabaseSchemaHelp } from '../components/DatabaseSchemaHelp';

const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary-500 focus:ring-secondary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-secondary-500 dark:focus:ring-secondary-500";

interface SettingsProps {
    currentUser: User;
    users: User[];
    onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
    onAddUser: (user: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => Promise<void>;
    onDeleteUser: (userId: string) => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const SettingsSection: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b dark:border-gray-700 last:border-b-0">
        <div className="md:col-span-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            {children}
        </div>
    </div>
);

export const Settings: React.FC<SettingsProps> = ({ currentUser, users, onUpdateUser, onAddUser, onDeleteUser, showToast }) => {
    const [name, setName] = useState(currentUser.name);
    const [email, setEmail] = useState(currentUser.email);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showSql, setShowSql] = useState(false);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try { await onUpdateUser(currentUser.id, { name, email }); showToast('Perfil atualizado com sucesso!'); } catch (error: any) { }
    };
    
    const handleDelete = (userId: string) => {
        if (currentUser?.id === userId) { showToast("Você não pode excluir seu próprio usuário.", 'error'); return; }
        if (window.confirm('Excluir este usuário?')) { onDeleteUser(userId); }
    };

    const handleOpenAddUserModal = () => { setEditingUser(null); setIsUserModalOpen(true); };
    const handleOpenEditUserModal = (user: User) => { setEditingUser(user); setIsUserModalOpen(true); };
    
    const handleSaveUser = async (data: { name: string; email: string; role: UserRole; password?: string; }) => {
        if (editingUser) { const { password, ...profileData } = data; await onUpdateUser(editingUser.id, profileData); } 
        else { if (!data.password) { showToast("Senha obrigatória.", 'error'); return; } await onAddUser({ name: data.name, email: data.email, role: data.role, password: data.password }); }
    }

    return (
        <>
            {isUserModalOpen && <AddUserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} existingUser={editingUser} />}
            <div className="space-y-4">
                <SettingsSection title="Meu Perfil" description="Atualize suas informações.">
                    <form className="space-y-4" onSubmit={handleProfileSubmit}>
                        <div><label className="block text-sm font-medium">Nome</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} /></div>
                        <div><label className="block text-sm font-medium">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} /></div>
                        <div className="text-right"><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-secondary-700 rounded-lg hover:bg-secondary-800">Salvar</button></div>
                    </form>
                </SettingsSection>

                {currentUser.role === 'Super Admin' && (
                    <SettingsSection title="Usuários" description="Gerencie o acesso ao sistema.">
                        <div className="space-y-4">
                            <div className="flex justify-end"><button onClick={handleOpenAddUserModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary-700 rounded-lg"><PlusCircle size={16} /> Adicionar</button></div>
                            <ul className="divide-y dark:divide-gray-700">
                                {users.map(user => (
                                    <li key={user.id} className="py-3 flex justify-between items-center">
                                        <div className="flex items-center gap-3"><img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" /><div><p className="font-semibold">{user.name}</p><p className="text-sm text-gray-500">{user.email}</p></div></div>
                                        <div className="flex items-center gap-4"><span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800"><Shield size={12} className="mr-1.5"/>{user.role}</span><div><button onClick={() => handleOpenEditUserModal(user)} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={16} /></button><button onClick={() => handleDelete(user.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button></div></div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </SettingsSection>
                )}

                {currentUser.role === 'Super Admin' && (
                     <div className="border-t dark:border-gray-700 pt-6">
                        <button onClick={() => setShowSql(!showSql)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                            <Database size={16} /> {showSql ? 'Ocultar Script' : 'Ver Script de Migração (SQL)'}
                        </button>
                        {showSql && <DatabaseSchemaHelp />}
                     </div>
                )}
            </div>
        </>
    );
};