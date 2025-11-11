import React, { useState } from 'react';
import { Send, Clock, MessageSquareX } from 'lucide-react';
import { Communication, Member, UserRole } from '../types';

const INPUT_CLASS = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary-500 focus:ring-secondary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-secondary-500 dark:focus:ring-secondary-500 disabled:opacity-50";

interface CommunicationsProps {
    members: Member[];
    communications: Communication[];
    onAddCommunication: (communication: Omit<Communication, 'id'>) => Promise<void>;
    userRole: UserRole;
}

export const Communications: React.FC<CommunicationsProps> = ({ members, communications, onAddCommunication, userRole }) => {
    const [recipient, setRecipient] = useState('all');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const canPerformActions = userRole === 'Super Admin' || userRole === 'Financeiro';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !message) {
            alert('Assunto e Mensagem são obrigatórios.');
            return;
        }
        setIsSaving(true);

        let recipientText = 'Todos os Membros';
        if (recipient === 'active') {
            recipientText = 'Membros Ativos';
        } else if (recipient === 'inactive') {
            recipientText = 'Membros Inativos';
        } else if (recipient !== 'all') {
            const selectedMember = members.find(m => m.id === recipient);
            recipientText = selectedMember ? selectedMember.name : 'Desconhecido';
        }

        try {
            await onAddCommunication({
                subject,
                message,
                recipients: recipientText,
                sentAt: new Date().toISOString()
            });
            // Reset form on success
            setSubject('');
            setMessage('');
            setRecipient('all');
        } catch (error) {
            // Error is handled by the parent toast.
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {canPerformActions ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Enviar Nova Comunicação</h2>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Destinatários</label>
                            <select 
                                id="recipient" 
                                name="recipient" 
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className={INPUT_CLASS}
                                disabled={isSaving}
                            >
                                <option value="all">Todos os Membros</option>
                                <option value="active">Membros Ativos</option>
                                <option value="inactive">Membros Inativos</option>
                                <optgroup label="Membros Individuais">
                                    {members.map(member => (
                                        <option key={member.id} value={member.id}>{member.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assunto</label>
                            <input 
                                type="text" 
                                name="subject" 
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className={INPUT_CLASS} 
                                disabled={isSaving}
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem</label>
                            <textarea 
                                id="message" 
                                name="message" 
                                rows={8}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className={INPUT_CLASS}
                                disabled={isSaving}
                            ></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary-700 rounded-lg hover:bg-secondary-800 disabled:bg-secondary-400 disabled:cursor-wait" disabled={isSaving}>
                                <Send size={16} /> {isSaving ? 'Enviando...' : 'Enviar Mensagem'}
                            </button>
                        </div>
                    </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Enviar Nova Comunicação</h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 p-8">Você não tem permissão para enviar comunicações.</p>
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Histórico de Envios</h2>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {communications.length > 0 ? communications.map(comm => (
                        <div key={comm.id} className="border-l-4 border-secondary-500 pl-4">
                            <p className="font-semibold text-sm">{comm.subject}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Para: {comm.recipients}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1"><Clock size={12} className="mr-1.5"/>{new Date(comm.sentAt).toLocaleString('pt-BR')}</p>
                        </div>
                    )) : (
                         <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            <MessageSquareX size={48} className="mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">Nenhuma mensagem enviada</h3>
                            <p className="text-sm">O histórico aparecerá aqui.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};