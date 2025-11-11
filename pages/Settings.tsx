import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { PlusCircle, Edit, Trash2, Shield } from 'lucide-react';
import { AddUserModal } from '../components/AddUserModal';

const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-primary-500 dark:focus:ring-primary-500";

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
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await onUpdateUser(currentUser.id, { name, email });
            showToast('Perfil atualizado com sucesso!');
        } catch (error: any) {
            // Error toast is already shown by handleCrudOperation
        } finally {
            setIsSavingProfile(false);
        }
    };
    
    const handleDelete = (userId: string) => {
        if (currentUser?.id === userId) {
            showToast("Você não pode excluir seu próprio usuário.", 'error');
            return;
        }
        if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            onDeleteUser(userId);
        }
    };

    const handleOpenAddUserModal = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const handleOpenEditUserModal = (user: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };
    
    const handleSaveUser = async (data: { name: string; email: string; role: UserRole; password?: string; }) => {
        if (editingUser) {
            const { password, ...profileData } = data;
            await onUpdateUser(editingUser.id, profileData);
        } else {
            if (!data.password) {
                showToast("A senha é obrigatória para criar um novo usuário.", 'error');
                return;
            }
            const newUserPayload = {
                name: data.name,
                email: data.email,
                role: data.role,
                password: data.password,
            };
            await onAddUser(newUserPayload);
        }
    }

    return (
        <>
            {isUserModalOpen && (
                 <AddUserModal
                    isOpen={isUserModalOpen}
                    onClose={() => setIsUserModalOpen(false)}
                    onSave={handleSaveUser}
                    existingUser={editingUser}
                />
            )}
            <div className="space-y-4">
                <SettingsSection title="Meu Perfil" description="Atualize suas informações pessoais e de contato.">
                    <form className="space-y-4" onSubmit={handleProfileSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                            <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} disabled={isSavingProfile}/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} disabled={isSavingProfile}/>
                        </div>
                        <div className="text-right">
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:bg-primary-400 disabled:cursor-wait" disabled={isSavingProfile}>
                                {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </SettingsSection>

                {currentUser.role === 'Super Admin' && (
                    <SettingsSection title="Gestão de Usuários" description="Adicione, edite ou remova usuários do sistema.">
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button onClick={handleOpenAddUserModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800">
                                    <PlusCircle size={16} /> Adicionar Usuário
                                </button>
                            </div>
                            <ul className="divide-y dark:divide-gray-700">
                                {users.map(user => (
                                    <li key={user.id} className="py-3 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                                            <div>
                                                <p className="font-semibold">{user.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                <Shield size={12} className="mr-1.5"/>
                                                {user.role}
                                            </span>
                                            <div>
                                                <button onClick={() => handleOpenEditUserModal(user)} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-500 hover:text-primary-700 dark:hover:text-primary-500"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </SettingsSection>
                )}
            </div>
        </>
    );
};
