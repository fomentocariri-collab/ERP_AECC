import React, { useEffect, useState } from 'react';
import { InventoryItem, InventoryCondition } from '../types';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  existingItem?: InventoryItem | null;
}

const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary-500 focus:ring-secondary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-secondary-500 dark:focus:ring-secondary-500 transition-colors";
const ERROR_CLASS = "text-red-500 text-xs mt-1 font-medium";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const inventorySchema = z.object({
  name: z.string().min(3, "Nome obrigatório"),
  code: z.string().min(1, "Código de tombamento obrigatório"),
  acquisitionDate: z.string().min(1, "Data obrigatória"),
  value: z.string().transform((val) => parseFloat(val)).refine((val) => !isNaN(val) && val >= 0, "Valor inválido"),
  condition: z.enum(['New', 'Good', 'Fair', 'Poor', 'Broken']),
  location: z.string().min(2, "Localização obrigatória"),
  description: z.string().optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({ isOpen, onClose, onSave, existingItem }) => {
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      condition: 'New',
      acquisitionDate: new Date().toISOString().split('T')[0],
      value: '0'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (existingItem) {
        setValue('name', existingItem.name);
        setValue('code', existingItem.code);
        setValue('acquisitionDate', existingItem.acquisitionDate);
        setValue('value', existingItem.value.toString());
        setValue('condition', existingItem.condition);
        setValue('location', existingItem.location);
        setValue('description', existingItem.description || '');
      } else {
        reset({
            condition: 'New',
            acquisitionDate: new Date().toISOString().split('T')[0],
            value: '0'
        });
      }
    }
  }, [isOpen, existingItem, setValue, reset]);

  const onSubmit = async (data: InventoryFormData) => {
    setIsSaving(true);
    try {
        await onSave({ ...data, value: data.value || 0 });
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{existingItem ? 'Editar Item' : 'Novo Item de Patrimônio'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className={LABEL_CLASS}>Nome do Item / Mobiliário</label>
                <input {...register('name')} className={INPUT_CLASS} placeholder="Ex: Cadeira de Escritório" />
                {errors.name && <p className={ERROR_CLASS}>{errors.name.message as string}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Código (Tombamento)</label>
                    <input {...register('code')} className={INPUT_CLASS} placeholder="PAT-001" />
                    {errors.code && <p className={ERROR_CLASS}>{errors.code.message as string}</p>}
                </div>
                 <div>
                    <label className={LABEL_CLASS}>Data Aquisição</label>
                    <input type="date" {...register('acquisitionDate')} className={INPUT_CLASS} />
                    {errors.acquisitionDate && <p className={ERROR_CLASS}>{errors.acquisitionDate.message as string}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={LABEL_CLASS}>Valor (R$)</label>
                    <input type="number" step="0.01" {...register('value')} className={INPUT_CLASS} />
                    {errors.value && <p className={ERROR_CLASS}>{errors.value.message as string}</p>}
                </div>
                 <div>
                    <label className={LABEL_CLASS}>Condição</label>
                    <select {...register('condition')} className={INPUT_CLASS}>
                        <option value="New">Novo</option>
                        <option value="Good">Bom</option>
                        <option value="Fair">Regular</option>
                        <option value="Poor">Ruim</option>
                        <option value="Broken">Quebrado/Inservível</option>
                    </select>
                </div>
            </div>
            
            <div>
                <label className={LABEL_CLASS}>Localização Atual</label>
                <input {...register('location')} className={INPUT_CLASS} placeholder="Ex: Sala de Reuniões" />
                {errors.location && <p className={ERROR_CLASS}>{errors.location.message as string}</p>}
            </div>

            <div>
                <label className={LABEL_CLASS}>Descrição Adicional</label>
                <textarea {...register('description')} rows={2} className={INPUT_CLASS} />
            </div>
          
            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700 mt-4">
                <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-white bg-secondary-700 rounded-lg hover:bg-secondary-800 disabled:bg-secondary-400 disabled:cursor-wait shadow-sm">{isSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};