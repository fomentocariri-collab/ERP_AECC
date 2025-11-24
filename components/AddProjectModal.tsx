import React, { useEffect, useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id'>) => Promise<void>;
  existingProject?: Project | null;
}

const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary-500 focus:ring-secondary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-secondary-500 dark:focus:ring-secondary-500 transition-colors";
const TEXTAREA_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary-500 focus:ring-secondary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-secondary-500 dark:focus:ring-secondary-500 transition-colors";
const ERROR_CLASS = "text-red-500 text-xs mt-1 font-medium";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const projectSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ser mais detalhada"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional().nullable(),
  status: z.enum(['Planning', 'Active', 'Completed', 'Cancelled']),
  proponent: z.string().min(2, "Informe o proponente"),
  sponsor: z.string().min(2, "Informe o patrocinador"),
  budget: z.string().transform((val) => parseFloat(val)).refine((val) => !isNaN(val) && val >= 0, "Orçamento inválido"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onSave, existingProject }) => {
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'Planning',
      startDate: new Date().toISOString().split('T')[0],
      budget: '0'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (existingProject) {
        setValue('title', existingProject.title);
        setValue('description', existingProject.description);
        setValue('startDate', existingProject.startDate);
        setValue('endDate', existingProject.endDate || '');
        setValue('status', existingProject.status);
        setValue('proponent', existingProject.proponent);
        setValue('sponsor', existingProject.sponsor);
        setValue('budget', existingProject.budget.toString());
      } else {
        reset({
             status: 'Planning',
             startDate: new Date().toISOString().split('T')[0],
             budget: '0'
        });
      }
    }
  }, [isOpen, existingProject, setValue, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    setIsSaving(true);
    try {
        const finalData = {
            ...data,
            endDate: data.endDate || null,
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl transform transition-all" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{existingProject ? 'Editar Projeto' : 'Cadastrar Novo Projeto'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className={LABEL_CLASS}>Título do Projeto</label>
                    <input {...register('title')} className={INPUT_CLASS} placeholder="Ex: Feira de Artesanato 2024" />
                    {errors.title && <p className={ERROR_CLASS}>{errors.title.message as string}</p>}
                </div>
                
                <div className="md:col-span-2">
                    <label className={LABEL_CLASS}>Descrição Detalhada</label>
                    <textarea {...register('description')} rows={6} className={TEXTAREA_CLASS} placeholder="Descreva os objetivos, público-alvo e detalhes do projeto..." />
                    {errors.description && <p className={ERROR_CLASS}>{errors.description.message as string}</p>}
                </div>

                <div>
                     <label className={LABEL_CLASS}>Proponente</label>
                     <input {...register('proponent')} className={INPUT_CLASS} placeholder="Ex: João da Silva" />
                     {errors.proponent && <p className={ERROR_CLASS}>{errors.proponent.message as string}</p>}
                </div>
                
                <div>
                     <label className={LABEL_CLASS}>Patrocinador / Fonte de Recurso</label>
                     <input {...register('sponsor')} className={INPUT_CLASS} placeholder="Ex: Lei Paulo Gustavo" />
                     {errors.sponsor && <p className={ERROR_CLASS}>{errors.sponsor.message as string}</p>}
                </div>

                <div>
                     <label className={LABEL_CLASS}>Data de Início</label>
                     <input type="date" {...register('startDate')} className={INPUT_CLASS} />
                     {errors.startDate && <p className={ERROR_CLASS}>{errors.startDate.message as string}</p>}
                </div>

                <div>
                     <label className={LABEL_CLASS}>Data de Aceite/Término (Opcional)</label>
                     <input type="date" {...register('endDate')} className={INPUT_CLASS} />
                </div>
                
                <div>
                     <label className={LABEL_CLASS}>Orçamento Previsto (R$)</label>
                     <input type="number" step="0.01" {...register('budget')} className={INPUT_CLASS} />
                     {errors.budget && <p className={ERROR_CLASS}>{errors.budget.message as string}</p>}
                </div>

                <div>
                    <label className={LABEL_CLASS}>Status</label>
                    <select {...register('status')} className={INPUT_CLASS}>
                        <option value="Planning">Planejamento</option>
                        <option value="Active">Em Andamento</option>
                        <option value="Completed">Concluído</option>
                        <option value="Cancelled">Cancelado</option>
                    </select>
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
                className="px-5 py-2.5 text-sm font-medium text-white bg-secondary-700 rounded-lg hover:bg-secondary-800 disabled:bg-secondary-400 disabled:cursor-wait transition-colors shadow-sm"
                >
                {isSaving ? 'Salvando...' : (existingProject ? 'Salvar Alterações' : 'Criar Projeto')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};