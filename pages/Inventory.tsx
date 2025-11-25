import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Box, MapPin } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AddInventoryModal } from '../components/AddInventoryModal';
import { InventoryItem, UserRole } from '../types';

interface InventoryProps { userRole: UserRole; showToast: (msg: string, type?: 'success'|'error') => void; }
const getConditionColor = (c: string) => ({ 'New': 'text-green-600 bg-green-100', 'Good': 'text-blue-600 bg-blue-100', 'Fair': 'text-yellow-600 bg-yellow-100', 'Poor': 'text-orange-600 bg-orange-100', 'Broken': 'text-red-600 bg-red-100' }[c] || 'text-gray-600 bg-gray-100');

export const Inventory: React.FC<InventoryProps> = ({ userRole, showToast }) => {
    const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const canPerformActions = userRole === 'Super Admin' || userRole === 'Financeiro';

    const handleOpenAdd = () => { setEditingItem(null); setIsModalOpen(true); };
    const handleOpenEdit = (item: InventoryItem) => { setEditingItem(item); setIsModalOpen(true); };
    const handleDelete = async (id: string) => { if(window.confirm("Dar baixa no item?")) { await deleteInventoryItem(id); showToast("Item removido!"); } }
    const handleSave = async (data: Omit<InventoryItem, 'id'>) => {
        if(editingItem) { await updateInventoryItem(editingItem.id, data); showToast("Atualizado!"); }
        else { await addInventoryItem(data); showToast("Tombado!"); }
    };

    return (
        <>
            <AddInventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} existingItem={editingItem} />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Box className="text-orange-600" /> Patrimônio</h2>
                    {canPerformActions && <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-secondary-700 text-white rounded-lg hover:bg-secondary-800"><PlusCircle size={18} /> Tombar Item</button>}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"><tr><th className="px-6 py-3">Código</th><th className="px-6 py-3">Item</th><th className="px-6 py-3">Condição</th><th className="px-6 py-3">Localização</th><th className="px-6 py-3">Valor</th>{canPerformActions && <th className="px-6 py-3 text-right">Ações</th>}</tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {inventory.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 font-mono">{item.code}</td>
                                    <td className="px-6 py-4 font-medium">{item.name}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getConditionColor(item.condition)}`}>{item.condition}</span></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-1"><MapPin size={12}/> {item.location}</div></td>
                                    <td className="px-6 py-4">R$ {item.value.toFixed(2)}</td>
                                    {canPerformActions && <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleOpenEdit(item)}><Edit size={16} /></button><button onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button></div></td>}
                                </tr>
                            ))}
                            {inventory.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nenhum item tombado.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};