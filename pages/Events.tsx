import React, { useState } from 'react';
import { PlusCircle, MapPin, Clock, CalendarOff, Edit, Trash2 } from 'lucide-react';
import { Event, UserRole } from '../types';
import { AddEventModal } from '../components/AddEventModal';

interface EventCardProps {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
  canPerformActions: boolean;
  isSubscribed: boolean;
  onSubscribe: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete, canPerformActions, isSubscribed, onSubscribe }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col justify-between relative">
    {canPerformActions && (
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={onEdit} className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300">
          <Edit size={16} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 hover:text-secondary-700 dark:text-gray-300 dark:hover:text-secondary-500">
          <Trash2 size={16} />
        </button>
      </div>
    )}
    <div>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-primary-700 dark:text-primary-400">{event.type}</p>
          <h3 className="text-lg font-bold mt-1 pr-16">{event.title}</h3>
        </div>
        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{event.date}</span>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 space-y-1">
        <p className="flex items-center"><Clock size={14} className="mr-2" />{event.time}</p>
        <p className="flex items-center"><MapPin size={14} className="mr-2" />{event.location}</p>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{event.description}</p>
    </div>
    <div className="mt-6">
      <button 
        onClick={onSubscribe}
        disabled={isSubscribed}
        className={`w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
          isSubscribed
            ? 'bg-green-600 cursor-not-allowed'
            : 'bg-primary-700 hover:bg-primary-800'
        }`}
      >
        {isSubscribed ? 'Inscrito' : 'Inscrever-se'}
      </button>
    </div>
  </div>
);

interface EventsProps {
  events: Event[];
  onAddEvent: (newEvent: Omit<Event, 'id'>) => void;
  onUpdateEvent: (eventId: string, updatedData: Omit<Event, 'id'>) => void;
  onDeleteEvent: (eventId: string) => void;
  userRole: UserRole;
}

export const Events: React.FC<EventsProps> = ({ events, onAddEvent, onUpdateEvent, onDeleteEvent, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [subscribedEvents, setSubscribedEvents] = useState<Set<string>>(new Set());
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  
  const canPerformActions = userRole === 'Super Admin' || userRole === 'Financeiro';

  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleSaveEvent = (data: Omit<Event, 'id'>) => {
    if (editingEvent) {
      onUpdateEvent(editingEvent.id, data);
    } else {
      onAddEvent(data);
    }
  };

  const handleDelete = (eventId: string) => {
    if (window.confirm('Tem certeza que deseja excluir/cancelar este evento?')) {
      onDeleteEvent(eventId);
    }
  };

  const handleSubscribe = (eventId: string) => {
    setSubscribedEvents(prev => new Set(prev).add(eventId));
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000); // Hide alert after 3 seconds
  };

  return (
    <>
      <AddEventModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        existingEvent={editingEvent}
      />
      
      {showSuccessAlert && (
        <div className="fixed top-20 right-6 bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg z-50" role="alert">
          <strong className="font-bold">Sucesso!</strong>
          <span className="block sm:inline"> Inscrição realizada.</span>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Próximos Eventos</h2>
          {canPerformActions && (
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800">
              <PlusCircle size={16} /> Criar Evento
            </button>
          )}
        </div>
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onEdit={() => handleOpenEditModal(event)}
                onDelete={() => handleDelete(event.id)}
                canPerformActions={canPerformActions}
                isSubscribed={subscribedEvents.has(event.id)}
                onSubscribe={() => handleSubscribe(event.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-md text-center text-gray-500 dark:text-gray-400">
            <CalendarOff size={48} className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Nenhum evento agendado</h3>
            <p className="text-sm">Clique em "Criar Evento" para adicionar o primeiro.</p>
          </div>
        )}
      </div>
    </>
  );
};