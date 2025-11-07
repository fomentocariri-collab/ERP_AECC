import React, { useState, useEffect, useCallback } from 'react';
import { Event, EventType } from '../types';
import { X } from 'lucide-react';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, 'id'>) => Promise<void>;
  existingEvent?: Event | null;
}

const eventTypes: EventType[] = ['Feira', 'Reunião Ordinária', 'Encontro', 'Oficina', 'Treinamento', 'Outros'];
const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-primary-500 dark:focus:ring-primary-500";


export const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onSave, existingEvent }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<EventType>('Reunião Ordinária');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!existingEvent;

  const resetForm = useCallback(() => {
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('09:00');
    setLocation('');
    setType('Reunião Ordinária');
    setDescription('');
    setError('');
    setIsSaving(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && existingEvent) {
        setTitle(existingEvent.title);
        setDate(existingEvent.date);
        setTime(existingEvent.time);
        setLocation(existingEvent.location);
        setType(existingEvent.type);
        setDescription(existingEvent.description);
      } else {
        resetForm();
      }
    }
  }, [isOpen, existingEvent, isEditing, resetForm]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !location) {
      setError('Todos os campos, exceto descrição, são obrigatórios.');
      return;
    }
    setError('');
    setIsSaving(true);
    
    try {
        await onSave({ 
            title, date, time, location, description, type
        });
        onClose();
    } catch (e) {
        // Error is handled by the parent component's toast
        console.error("Failed to save event", e);
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{isEditing ? 'Editar Evento' : 'Criar Novo Evento'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Evento</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT_CLASS} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Evento</label>
                <select id="type" value={type} onChange={(e) => setType(e.target.value as EventType)} className={INPUT_CLASS}>
                  {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local</label>
                <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className={INPUT_CLASS} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT_CLASS} required />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora</label>
                <input type="time" id="time" value={time} onChange={(e) => setTime(e.target.value)} className={INPUT_CLASS} required />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição (Opcional)</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={INPUT_CLASS}></textarea>
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
              {isSaving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Evento')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};