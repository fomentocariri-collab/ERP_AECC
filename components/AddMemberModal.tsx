import React, { useEffect, useState } from 'react';
import { Member, MemberRole } from '../types';
import { X, UserSquare, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id'>) => Promise<void>;
  existingMember?: Member | null;
}

const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-primary-500 dark:focus:ring-primary-500 transition-colors";
const ERROR_CLASS = "text-red-500 text-xs mt-1 font-medium";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 dark:text-gray-300";

// SENIOR UPGRADE: Zod Schema Definition para validação robusta
const memberSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF inválido").optional().or(z.literal('')),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  admissionDate: z.string().min(1, "Data de admissão é obrigatória"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "UF deve ter 2 letras").optional().or(z.literal('')),
  role: z.enum(['Diretoria', 'Membro Fundador', 'Associado']),
  status: z.enum(['Active', 'Inactive', 'Pending']),
});

type MemberFormData = z.infer<typeof memberSchema>;

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSave, existingMember }) => {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // SENIOR UPGRADE: React Hook Form integration
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
        setValue('name', existingMember.name);
        setValue('email', existingMember.email);
        setValue('cpf', existingMember.cpf || '');
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
    try {
        const finalData = {
            ...data,
            birthDate: data.birthDate || null, 
            avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${data.email}`
        } as any;

        await onSave(finalData);
        onClose();
    } catch (e) {
        console.error(e);
    } finally {
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-3xl transform transition-all" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{existingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Foto Section */}
            <div className="flex-shrink-0 flex flex-col items-center space-y-3">
                <div className="w-32 h-32 rounded-full ring-4 ring-gray-100 dark:ring-gray-700 overflow-hidden relative group">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Prévia" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <UserSquare size={48} className="text-gray-400" />
                        </div>
                    )}
                    <label htmlFor="photo-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="text-white" size={24} />
                    </label>
                </div>
                <label htmlFor="photo-upload" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 cursor-pointer">
                    {avatarUrl ? 'Alterar foto' : 'Enviar foto'}
                    <input id="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                </label>
            </div>

            {/* Form Fields */}
            <div className="flex-grow space-y-4 w-full max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL_CLASS}>Nome Completo</label>
                        <input {...register('name')} className={INPUT_CLASS} placeholder="Ex: João da Silva" />
                        {errors.name && <p className={ERROR_CLASS}>{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Email</label>
                        <input type="email" {...register('email')} className={INPUT_CLASS} placeholder="joao@email.com" />
                        {errors.email && <p className={ERROR_CLASS}>{errors.email.message}</p>}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL_CLASS}>CPF</label>
                        <input {...register('cpf')} className={INPUT_CLASS} placeholder="000.000.000-00" />
                        {errors.cpf && <p className={ERROR_CLASS}>{errors.cpf.message}</p>}
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Telefone</label>
                        <input {...register('phone')} className={INPUT_CLASS} placeholder="(00) 00000-0000" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                         <label className={LABEL_CLASS}>Data de Nascimento</label>
                         <input type="date" {...register('birthDate')} className={INPUT_CLASS} />
                    </div>
                    <div>
                         <label className={LABEL_CLASS}>Data de Admissão</label>
                         <input type="date" {...register('admissionDate')} className={INPUT_CLASS} />
                         {errors.admissionDate && <p className={ERROR_CLASS}>{errors.admissionDate.message}</p>}
                    </div>
                </div>

                <div className="border-t dark:border-gray-700 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Endereço</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={LABEL_CLASS}>Logradouro</label>
                            <input {...register('address')} className={INPUT_CLASS} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>Cidade</label>
                                <input {...register('city')} className={INPUT_CLASS} />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>UF</label>
                                <input {...register('state')} className={INPUT_CLASS} maxLength={2} placeholder="CE" />
                                {errors.state && <p className={ERROR_CLASS}>{errors.state.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>
                
                 <div className="border-t dark:border-gray-700 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Configurações da Associação</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Função</label>
                            <select {...register('role')} className={INPUT_CLASS}>
                                <option value="Associado">Associado</option>
                                <option value="Membro Fundador">Membro Fundador</option>
                                <option value="Diretoria">Diretoria</option>
                            </select>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Status</label>
                            <select {...register('status')} className={INPUT_CLASS}>
                                <option value="Pending">Pendente</option>
                                <option value="Active">Ativo</option>
                                <option value="Inactive">Inativo</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:bg-primary-400 disabled:cursor-wait transition-colors shadow-sm"
            >
              {isSaving ? 'Salvando...' : (existingMember ? 'Salvar Alterações' : 'Salvar Membro')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};