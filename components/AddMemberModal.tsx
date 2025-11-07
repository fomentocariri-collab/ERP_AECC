import React, { useState, useEffect, useCallback } from 'react';
import { Member, MemberRole } from '../types';
import { X, UserSquare } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id'>) => Promise<void>;
  existingMember?: Member | null;
}

const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-primary-500 dark:focus:ring-primary-500";

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSave, existingMember }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Pending'>('Pending');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [role, setRole] = useState<MemberRole>('Associado');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!existingMember;

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setStatus('Pending');
    setCpf('');
    setAddress('');
    setCity('');
    setState('');
    setPhone('');
    setBirthDate('');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setRole('Associado');
    setAvatarUrl('');
    setError('');
    setIsSaving(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && existingMember) {
        setName(existingMember.name);
        setEmail(existingMember.email);
        setStatus(existingMember.status);
        setCpf(existingMember.cpf || '');
        setAddress(existingMember.address || '');
        setCity(existingMember.city || '');
        setState(existingMember.state || '');
        setPhone(existingMember.phone || '');
        setBirthDate(existingMember.birthDate || '');
        setAdmissionDate(existingMember.admissionDate);
        setRole(existingMember.role);
        setAvatarUrl(existingMember.avatarUrl || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, existingMember, isEditing, resetForm]);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !admissionDate) {
      setError('Nome, Email e Data de Admissão são obrigatórios.');
      return;
    }
    setError('');
    setIsSaving(true);
    
    const memberData: Omit<Member, 'id'> = { 
        name, 
        email, 
        status, 
        cpf, 
        address, 
        city, 
        state, 
        phone, 
        birthDate: birthDate || null,
        admissionDate, 
        role,
        avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${email}`
    };

    try {
      await onSave(memberData);
      onClose(); // Close modal on success
    } catch (error) {
      // Error is handled by the parent component's toast notification
      console.error("Failed to save member:", error);
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{isEditing ? 'Editar Membro' : 'Adicionar Novo Membro'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            
            <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Foto do Perfil</label>
                    <div className="mt-1 flex flex-col items-center">
                        <div className="w-32 h-32 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Prévia" className="w-full h-full object-cover" />
                        ) : (
                            <UserSquare size={64} className="text-gray-400" />
                        )}
                        </div>
                        <label htmlFor="photo-upload" className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 cursor-pointer">
                            {avatarUrl ? 'Alterar foto' : 'Enviar foto'}
                            <input id="photo-upload" name="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                        </label>
                    </div>
                </div>

                <div className="flex-grow space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} required/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} required/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
                            <input type="text" id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} className={INPUT_CLASS} />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                            <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT_CLASS} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Nascimento</label>
                        <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={INPUT_CLASS} />
                    </div>
                </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
                 <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Endereço</h3>
            </div>
             <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
                <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cidade</label>
                    <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} className={INPUT_CLASS} />
                </div>
                 <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">UF</label>
                    <input type="text" id="state" value={state} onChange={(e) => setState(e.target.value)} className={INPUT_CLASS} maxLength={2} />
                </div>
            </div>
            
             <div className="border-t dark:border-gray-700 pt-4">
                 <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Associação</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="admissionDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Admissão</label>
                    <input type="date" id="admissionDate" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} className={INPUT_CLASS} required/>
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Função</label>
                    <select id="role" value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className={INPUT_CLASS}>
                        <option value="Associado">Associado</option>
                        <option value="Membro Fundador">Membro Fundador</option>
                        <option value="Diretoria">Diretoria</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive' | 'Pending')} className={INPUT_CLASS}>
                        <option value="Pending">Pendente</option>
                        <option value="Active">Ativo</option>
                        <option value="Inactive">Inativo</option>
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
              {isSaving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Membro')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};