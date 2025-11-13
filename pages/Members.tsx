import React, { useState, useMemo } from 'react';
import { PlusCircle, Search, UserX, Edit, Trash2, AlertTriangle, Clipboard, Check, ExternalLink } from 'lucide-react';
import { Member, UserRole } from '../types';
import { AddMemberModal } from '../components/AddMemberModal';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { supabaseProjectId } from '../supabaseClient';

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

const STORAGE_AVATAR_POLICIES_SCRIPT = `-- SCRIPT DE POLÍTICAS PARA O BUCKET 'avatars'

-- ETAPA 1: Remova políticas antigas para uma instalação limpa (Opcional, mas recomendado)
DROP POLICY IF EXISTS "Allow public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own avatars" ON storage.objects;

-- ETAPA 2: Crie as novas políticas de acesso para o bucket 'avatars'
-- Política para VISUALIZAR (SELECT): Permite que qualquer pessoa veja os avatares.
CREATE POLICY "Allow public read access for avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Política para ENVIAR (INSERT): Permite que um usuário AUTENTICADO envie avatares para sua própria pasta.
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Política para ATUALIZAR (UPDATE): Permite que um usuário AUTENTICADO atualize avatares em sua própria pasta.
CREATE POLICY "Allow authenticated users to update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Política para EXCLUIR (DELETE): Permite que um usuário AUTENTICADO exclua avatares de sua própria pasta.
CREATE POLICY "Allow authenticated users to delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );
`;

const StorageInfoPanel: React.FC<{onClose: () => void}> = ({onClose}) => {
  const [copied, setCopied] = useState(false);
  const supabaseSqlUrl = `https://supabase.com/dashboard/project/${supabaseProjectId}/sql/new`;

  const handleCopy = () => {
    navigator.clipboard.writeText(STORAGE_AVATAR_POLICIES_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-lg mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-500" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">Ação Necessária: Configure as Permissões do Storage de Avatares</p>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
            <p>O upload do avatar falhou. Para corrigir, siga estes passos no seu painel Supabase:</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Vá para a seção <strong>Storage</strong>.</li>
                <li>Crie um novo "Bucket" chamado <code className="text-xs font-bold bg-yellow-200 dark:bg-yellow-800/50 p-1 rounded">avatars</code>. <strong>Importante:</strong> Marque a opção "Public bucket".</li>
                <li>Vá para o <strong>SQL Editor</strong>, cole e execute o script abaixo para aplicar as permissões corretas.</li>
            </ol>
            <div className="mt-2 p-2 relative bg-gray-800 dark:bg-gray-900 text-white rounded-md font-mono text-xs overflow-x-auto">
              <pre><code>{STORAGE_AVATAR_POLICIES_SCRIPT}</code></pre>
              <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-all">
                {copied ? <Check size={14} className="text-green-400"/> : <Clipboard size={14} />}
              </button>
            </div>
             <div className="mt-4 flex items-center gap-4">
               <a 
                href={supabaseSqlUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-secondary-700 rounded-md hover:bg-secondary-800"
              >
                <ExternalLink size={14} />
                Abrir Editor SQL do Supabase
              </a>
              <button onClick={onClose} className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:underline">Já corrigi, fechar aviso.</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MembersProps {
  members: Member[];
  onAddMember: (data: { memberData: Omit<Member, 'id' | 'avatarUrl'>, avatarFile: File | null }) => Promise<void>;
  onUpdateMember: (memberId: string, data: { memberData: Partial<Omit<Member, 'id'>>, avatarFile: File | null }) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
  userRole: UserRole;
}

export const Members: React.FC<MembersProps> = ({ members, onAddMember, onUpdateMember, onDeleteMember, userRole }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showStorageHelp, setShowStorageHelp] = useState(false);
  
  const canPerformActions = userRole === 'Super Admin';

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || member.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, searchTerm, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setIsAddModalOpen(true);
  };
  
  const handleOpenDetailModal = (member: Member) => {
    // Here you would typically fetch detailed data, but for now we'll just use what we have
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsDetailModalOpen(false);
    setEditingMember(null);
    setSelectedMember(null);
  };

  const handleSaveMember = async (data: { memberData: Omit<Member, 'id' | 'avatarUrl'>, avatarFile: File | null }) => {
    try {
        if (editingMember) {
            await onUpdateMember(editingMember.id, { memberData: data.memberData, avatarFile: data.avatarFile });
        } else {
            await onAddMember(data);
        }
    } catch (error: any) {
        if (error.context === 'storage') {
            setShowStorageHelp(true);
        }
        // Re-throw to be handled by the modal's finally block
        throw error;
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
            transactions={[]} // Data fetching logic will be added later
            events={[]} // Data fetching logic will be added later
        />
      )}
      {showStorageHelp && <StorageInfoPanel onClose={() => setShowStorageHelp(false)} />}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold">Lista de Membros ({filteredMembers.length})</h2>
          {canPerformActions && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary-700 rounded-lg hover:bg-secondary-800"
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
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary-500"
          >
            <option value="All">Todos os Status</option>
            <option value="Active">Ativos</option>
            <option value="Inactive">Inativos</option>
            <option value="Pending">Pendentes</option>
          </select>
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
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer" onClick={() => handleOpenDetailModal(member)}>
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
                       <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                         <button onClick={() => handleOpenEditModal(member)} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={16} /></button>
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
                      <p className="text-sm">Tente ajustar sua busca ou filtro.</p>
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