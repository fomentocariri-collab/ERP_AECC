import React, { useEffect, useState } from 'react';
import { Member, MemberRole } from '../types';
import { X, UserSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id'>) => Promise<void>;
  existingMember?: Member | null;
}

const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-primary-500 dark:focus:ring-primary-500";
const ERROR_CLASS = "text-red-500 text-xs mt-1";

// Zod Schema Definition
const memberSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().optional(), // Em um app real, validariamos o formato do CPF
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  admissionDate: z.string().min(1, "Data de admissão é obrigatória"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "UF deve ter 2 letras").optional(),
  role: z.enum(['Diretoria', 'Membro Fundador', 'Associado']),
  status: z.enum(['Active', 'Inactive', 'Pending']),
});

type MemberFormData = z.infer<typeof memberSchema>;

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSave, existingMember }) => {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      status: 'Pending',
      role: 'Associado',
      admissionDate: new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (existingMember) {
        // Populate form for editing
        setValue('name', existingMember.name);
        setValue('email', existingMember.email);
        setValue('cpf', existingMember.cpf);
        setValue('phone', existingMember.phone);
        setValue('birthDate', existingMember.birthDate || '');
        setValue('admissionDate', existingMember.admissionDate);
        setValue('address', existingMember.address);
        setValue('city', existingMember.city);
        setValue('state', existingMember.state);
        setValue('role', existingMember.role);
        setValue('status', existingMember.status);
        setAvatarUrl(existingMember.avatarUrl);
      } else {
        reset({
             status: 'Pending',
             role: 'Associado',
             admissionDate: new Date().toISOString().split('T')[0],
        });
        setAvatarUrl('');
      }
    }
  }, [isOpen, existingMember, setValue, reset]);

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

  const onSubmit = async (data: MemberFormData) => {
    setIsSaving(true);
    const finalData = {
        ...data,
        birthDate: data.birthDate || null, // Convert empty string to null for optional date
        avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${data.email}`
    } as any; // Type casting for simplicity here

    await onSave(finalData);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{existingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
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
                            <input id="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                        </label>
                    </div>
                </div>

                <div className="flex-grow space-y-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                            <input {...register('name')} className={INPUT_CLASS} />
                            {errors.name && <p className={ERROR_CLASS}>{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" {...register('email')} className={INPUT_CLASS} />
                            {errors.email && <p className={ERROR_CLASS}>{errors.email.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
                            <input {...register('cpf')} className={INPUT_CLASS} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                            <input {...register('phone')} className={INPUT_CLASS} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Nascimento</label>
                        <input type="date" {...register('birthDate')} className={INPUT_CLASS} />
                    </div>
                </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
                 <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Endereço</h3>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
                <input {...register('address')} className={INPUT_CLASS} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cidade</label>
                    <input {...register('city')} className={INPUT_CLASS} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">UF</label>
                    <input {...register('state')} className={INPUT_CLASS} maxLength={2} />
                    {errors.state && <p className={ERROR_CLASS}>{errors.state.message}</p>}
                </div>
            </div>
            
             <div className="border-t dark:border-gray-700 pt-4">
                 <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Associação</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Admissão</label>
                    <input type="date" {...register('admissionDate')} className={INPUT_CLASS} />
                    {errors.admissionDate && <p className={ERROR_CLASS}>{errors.admissionDate.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Função</label>
                    <select {...register('role')} className={INPUT_CLASS}>
                        <option value="Associado">Associado</option>
                        <option value="Membro Fundador">Membro Fundador</option>
                        <option value="Diretoria">Diretoria</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select {...register('status')} className={INPUT_CLASS}>
                        <option value="Pending">Pendente</option>
                        <option value="Active">Ativo</option>
                        <option value="Inactive">Inativo</option>
                    </select>
                </div>
            </div>
            
          </div>
          
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
              {isSaving ? 'Salvando...' : (existingMember ? 'Salvar Alterações' : 'Salvar Membro')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};