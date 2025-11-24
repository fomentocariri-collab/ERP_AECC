import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Palette, Mail, Phone, Briefcase } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AddProviderModal } from '../components/AddProviderModal';
import { ServiceProvider, UserRole } from '../types';

interface ProvidersProps {
    userRole: UserRole;
    showToast: (msg: string, type?: 'success'|'error') => void;
}

export const ServiceProviders: React.FC<ProvidersProps> = ({ userRole, showToast }) => {
    const { providers, addProvider, updateProvider, deleteProvider } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);

    const canPerformActions = userRole === 'Super Admin' || userRole === 'Financeiro';

    const handleOpenAdd = () => {
        setEditingProvider(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (p: ServiceProvider) => {
        setEditingProvider(p);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(window.confirm("Deseja realmente excluir este prestador?")) {
            await deleteProvider(id);
            showToast("Prestador excluído!");
        }
    }

    const handleSave = async (data: Omit<ServiceProvider, 'id'>) => {
        if(editingProvider) {
            await updateProvider(editingProvider.id, data);
            showToast("Prestador atualizado!");
        } else {
            await addProvider(data);
            showToast("Prestador cadastrado!");
        }
    };

    const getIconByType = (type: string) => {
        switch(type) {
            case 'Artist': return '🎨';
            case 'Designer': return '🖊️';
            case 'Workshop Facilitator': return '🎓';
            case 'Consultant': return '💼';
            default: return '🛠️';
        }
    }

    return (
        <>
            <AddProviderModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                existingProvider={editingProvider}
            />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Palette className="text-purple-600" /> Prestadores de Serviço
                    </h2>
                    {canPerformActions && (
                        <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-secondary-700 text-white rounded-lg hover:bg-secondary-800 shadow-sm">
                            <PlusCircle size={18} /> Novo Prestador
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {providers.map(p => (
                        <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700 relative hover:shadow-lg transition-shadow">
                             {canPerformActions && (
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button onClick={() => handleOpenEdit(p)} className="text-gray-400 hover:text-blue-500"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            )}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-2xl">
                                    {getIconByType(p.type)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{p.name}</h3>
                                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">{p.type}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <p className="flex items-center gap-2"><Mail size={14}/> {p.email}</p>
                                <p className="flex items-center gap-2"><Phone size={14}/> {p.phone}</p>
                                <p className="flex items-center gap-2"><Briefcase size={14}/> {p.cpfCnpj}</p>
                                {p.portfolioUrl && (
                                    <a href={p.portfolioUrl} target="_blank" rel="noreferrer" className="block text-blue-600 dark:text-blue-400 hover:underline mt-2">
                                        Ver Portfólio
                                    </a>
                                )}
                            </div>
                            {p.notes && (
                                <div className="mt-4 pt-3 border-t dark:border-gray-700 text-xs text-gray-500 italic">
                                    "{p.notes}"
                                </div>
                            )}
                        </div>
                    ))}
                    {providers.length === 0 && (
                         <div className="col-span-full text-center py-10 text-gray-500">
                             Nenhum prestador cadastrado.
                         </div>
                    )}
                </div>
            </div>
        </>
    );
};