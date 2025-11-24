import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, UserX, Edit, Trash2, Loader2 } from 'lucide-react';
import { Member, Transaction, Event, UserRole } from '../types';
import { AddMemberModal } from '../components/AddMemberModal';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { useData } from '../contexts/DataContext';

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
  transactions: Transaction[];
  events: Event[];
  onAddMember: (newMember: Omit<Member, 'id'>) => Promise<void>;
  onUpdateMember: (memberId: string, updatedData: Partial<Omit<Member, 'id'>>) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
  userRole: UserRole;
}

export const Members: React.FC<MembersProps> = ({ members, transactions, events, onAddMember, onUpdateMember, onDeleteMember, userRole }) => {
  // SENIOR UPGRADE: Usando fetchMembers do Context para Server-Side Filtering
  const { fetchMembers, loading } = useData(); 
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // States for server-side filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const canPerformActions = userRole === 'Super Admin';

  // SENIOR UPGRADE: Debounce para evitar excesso de requisições ao Supabase
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMembers(searchTerm, statusFilter);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, fetchMembers]);

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setIsAddModalOpen(true);
  };
  
  const handleOpenDetailModal = (member: Member) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsDetailModalOpen(false);
    setEditingMember(null);
    setSelectedMember(null);
  };

  const handleSaveMember = async (data: Omit<Member, 'id'>) => {
    if (editingMember) {
      await onUpdateMember(editingMember.id, data);
    } else {
      await onAddMember(data);
    }
    setIsAddModalOpen(false);
  };
  
  const handleDelete = async (memberId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este membro? Esta ação não pode ser desfeita.')) {
        await onDeleteMember(memberId);
    }
  };

  return (
    <>
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveMember}
        existingMember={editingMember}
      />
      {selectedMember && (
        <MemberDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseModal}
            member={selectedMember}
            transactions={transactions.filter(t => t.memberId === selectedMember.id)}
            events={events} 
        />
      )}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold">Lista de Membros</h2>
          {canPerformActions && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 transition-colors"
            >
              <PlusCircle size={16} /> Adicionar Membro
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou email (Server-side)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            <option value="All">Todos os Status</option>
            <option value="Active">Ativos</option>
            <option value="Inactive">Inativos</option>
            <option value="Pending">Pendentes</option>
          </select>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
             <div className="flex flex-col justify-center items-center h-48 text-gray-500">
                <Loader2 className="animate-spin text-primary-600 mb-2" size={32} />
                <span>Buscando dados...</span>
             </div>
          ) : (
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
                  <tr key={member.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors" onClick={() => handleOpenDetailModal(member)}>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center gap-3">
                      <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                      {member.name}
                    </td>
                    <td className="px-6 py-4">{member.email}</td>
                    <td className="px-6 py-4">{new Date(member.admissionDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    {canPerformActions && (
                       <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                         <button onClick={() => handleOpenEditModal(member)} className="p-2 text-gray-500 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                         <button onClick={() => handleDelete(member.id)} className="p-2 text-gray-500 hover:text-primary-700 dark:hover:text-primary-500 transition-colors"><Trash2 size={16} /></button>
                       </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                  <td colSpan={canPerformActions ? 5 : 4} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <UserX size={48} className="mb-2 opacity-50" />
                      <h3 className="text-lg font-semibold">Nenhum membro encontrado</h3>
                      <p className="text-sm">Tente ajustar sua busca ou filtro.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </>
  );
};