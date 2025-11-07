import React from 'react';
import { Member, Transaction, Event } from '../types';
import { X, User, Calendar, Mail, MapPin, Phone, DollarSign, CalendarCheck2, Briefcase, Info } from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  transactions: Transaction[];
  events: Event[];
}

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string | null | undefined;}> = ({ icon, label, value }) => (
    <div className="flex items-start text-sm">
        <div className="text-gray-500 dark:text-gray-400 w-6 h-6 flex-shrink-0">{icon}</div>
        <div className="ml-3">
            <p className="font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-gray-900 dark:text-gray-200">{value || 'Não informado'}</p>
        </div>
    </div>
);

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ isOpen, onClose, member, transactions, events }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <img src={member.avatarUrl} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
            <div>
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{member.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
            {/* Dados Cadastrais */}
            <div className="border-t dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold mb-4 text-primary-800 dark:text-primary-300">Dados Cadastrais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4">
                    <DetailRow icon={<Info size={20} />} label="CPF" value={member.cpf} />
                    <DetailRow icon={<MapPin size={20} />} label="Endereço" value={member.address ? `${member.address}, ${member.city}-${member.state}` : null} />
                    <DetailRow icon={<Phone size={20} />} label="Telefone" value={member.phone} />
                    <DetailRow icon={<Calendar size={20} />} label="Data de Nascimento" value={member.birthDate} />
                    <DetailRow icon={<CalendarCheck2 size={20} />} label="Data de Admissão" value={member.admissionDate} />
                    <DetailRow icon={<Briefcase size={20} />} label="Função na Associação" value={member.role} />
                </div>
            </div>

            {/* Histórico Financeiro */}
            <div className="border-t dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold mb-4 text-primary-800 dark:text-primary-300">Histórico Financeiro</h3>
                {transactions.length > 0 ? (
                    <ul className="space-y-2">
                        {transactions.map(t => (
                            <li key={t.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                <div>
                                    <p className="font-medium">{t.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.date}</p>
                                </div>
                                <p className={`font-semibold ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'Income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma transação encontrada para este membro.</p>
                )}
            </div>
            
            {/* Histórico de Eventos */}
            <div className="border-t dark:border-gray-700 pt-4">
                 <h3 className="text-lg font-semibold mb-4 text-primary-800 dark:text-primary-300">Participação em Eventos</h3>
                 <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Funcionalidade em desenvolvimento.</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Em breve, será possível ver os eventos que este membro participou.</p>
                 </div>
            </div>
        </div>

        <div className="flex justify-end pt-6 border-t dark:border-gray-700 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Fechar
            </button>
        </div>
      </div>
    </div>
  );
};