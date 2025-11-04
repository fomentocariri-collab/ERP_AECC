import React, { useState } from 'react';
import { PlusCircle, Filter, Download, UserX, Edit, Trash2 } from 'lucide-react';
import { Member, UserRole } from '../types';
import { AddMemberModal } from '../components/AddMemberModal';

const getStatusBadge = (status: Member['status']) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'Inactive':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  }
};

interface MembersProps {
  members: Member[];
  onAddMember: (newMember: Omit<Member, 'id'>) => Promise<void>;
  onUpdateMember: (memberId: string, updatedData: Omit<Member, 'id'>) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
  userRole: UserRole;
}

export const Members: React.FC<MembersProps> = ({ members, onAddMember, onUpdateMember, onDeleteMember, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  const canPerformActions = userRole === 'Super Admin';

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSaveMember = (data: Omit<Member, 'id'>) => {
    if (editingMember) {
      onUpdateMember(editingMember.id, data);
    } else {
      onAddMember(data);
    }
  };
  
  const handleDelete = async (memberId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este membro? Esta ação não pode ser desfeita.')) {
        await onDeleteMember(memberId);
    }
  };

  return (
    <>
      <AddMemberModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveMember}
        existingMember={editingMember}
      />
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold">Lista de Membros</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              <Download size={16} /> Exportar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              <Filter size={16} /> Filtrar
            </button>
            {canPerformActions && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
              >
                <PlusCircle size={16} /> Adicionar Membro
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Nome</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Data de Admissão</th>
                <th scope="col" className="px-6 py-3">Status</th>
                {canPerformActions && <th scope="col" className="px-6 py-3 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {members.length > 0 ? (
                members.map((member) => (
                  <tr key={member.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center gap-3">
                      <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                      {member.name}
                    </td>
                    <td className="px-6 py-4">{member.email}</td>
                    <td className="px-6 py-4">{member.admissionDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    {canPerformActions && (
                       <td className="px-6 py-4 text-right">
                         <button onClick={() => handleOpenEditModal(member)} className="p-2 text-gray-500 hover:text-primary-600"><Edit size={16} /></button>
                         <button onClick={() => handleDelete(member.id)} className="p-2 text-gray-500 hover:text-secondary-700 dark:hover:text-secondary-500"><Trash2 size={16} /></button>
                       </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                  <td colSpan={canPerformActions ? 5 : 4} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <UserX size={48} className="mb-2" />
                      <h3 className="text-lg font-semibold">Nenhum membro encontrado</h3>
                      <p className="text-sm">Comece adicionando o primeiro membro da sua associação.</p>
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