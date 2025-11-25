import React, { useEffect, useState } from 'react';
import { ServiceProvider } from '../types';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: Omit<ServiceProvider, 'id'>) => Promise<void>;
  existingProvider?: ServiceProvider | null;
}

const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary-500 focus:ring-secondary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-secondary-500 dark:focus:ring-secondary-500 transition-colors";
const ERROR_CLASS = "text-red-500 text-xs mt-1 font-medium";

const providerSchema = z.object({
  name: z.string().min(3, "Nome obrigatório"),
  type: z.enum(['Artist', 'Workshop Facilitator', 'Designer', 'Consultant', 'Other']),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Telefone inválido"),
  cpfCnpj: z.string().min(11, "Documento inválido"),
  portfolioUrl: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
});

type ProviderFormData = z.infer<typeof providerSchema>;

export const AddProviderModal: React.FC<AddProviderModalProps> = ({ isOpen, onClose, onSave, existingProvider }) => {
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: { type: 'Artist' }
  });

  useEffect(() => {
    if (isOpen) {
      if (existingProvider) {
        setValue('name', existingProvider.name);
        setValue('type', existingProvider.type);
        setValue('email', existingProvider.email);
        setValue('phone', existingProvider.phone);
        setValue('cpfCnpj', existingProvider.cpfCnpj);
        setValue('portfolioUrl', existingProvider.portfolioUrl || '');
        setValue('notes', existingProvider.notes || '');
      } else {
        reset({ type: 'Artist' });
      }
    }
  }, [isOpen, existingProvider, setValue, reset]);

  const onSubmit = async (data: ProviderFormData) => {
    setIsSaving(true);
    try { await onSave(data); onClose(); } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{existingProvider ? 'Editar Prestador' : 'Novo Prestador'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Nome / Razão Social</label>
                    <input {...register('name')} className={INPUT_CLASS} />
                    {errors.name && <p className={ERROR_CLASS}>{errors.name.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Tipo</label>
                    <select {...register('type')} className={INPUT_CLASS}>
                        <option value="Artist">Artista</option>
                        <option value="Workshop Facilitator">Oficineiro</option>
                        <option value="Designer">Designer</option>
                        <option value="Consultant">Consultor</option>
                        <option value="Other">Outro</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">CPF / CNPJ</label>
                    <input {...register('cpfCnpj')} className={INPUT_CLASS} />
                    {errors.cpfCnpj && <p className={ERROR_CLASS}>{errors.cpfCnpj.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input type="email" {...register('email')} className={INPUT_CLASS} />
                    {errors.email && <p className={ERROR_CLASS}>{errors.email.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Telefone</label>
                    <input {...register('phone')} className={INPUT_CLASS} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Portfólio (URL)</label>
                    <input {...register('portfolioUrl')} className={INPUT_CLASS} />
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700 mt-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2.5 text-white bg-secondary-700 rounded-lg hover:bg-secondary-800">{isSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};