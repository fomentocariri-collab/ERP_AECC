import React from 'react';
import { Member, Transaction, Event } from '../types';
import { X, User, Calendar, Mail, MapPin, Phone, DollarSign, CalendarCheck2, Briefcase, Info, FileText } from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  transactions: Transaction[];
  events: Event[];
}

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string | null | undefined;}> = ({ icon, label, value }) => (
    <div className="flex items-start text-sm py-2">
        <div className="text-primary-700 dark:text-primary-400 w-6 h-6 flex-shrink-0 flex items-center justify-center">{icon}</div>
        <div className="ml-3">
            <p className="font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-gray-900 dark:text-gray-200">{value || 'Não informado'}</p>
        </div>
    </div>
);

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="border-t dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-primary-800 dark:text-primary-300">
            {icon}
            {title}
        </h3>
        {children}
    </div>
);


export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ isOpen, onClose, member, transactions }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-scale 0.3s forwards' }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <img src={member.avatarUrl} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary-500" />
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{member.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{member.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-3 space-y-6">
            <Section title="Dados Cadastrais" icon={<User size={20}/>}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2">
                    <DetailRow icon={<Info size={18} />} label="CPF" value={member.cpf} />
                    <DetailRow icon={<MapPin size={18} />} label="Endereço" value={member.address ? `${member.address}, ${member.city}-${member.state}` : null} />
                    <DetailRow icon={<Phone size={18} />} label="Telefone" value={member.phone} />
                    <DetailRow icon={<Calendar size={18} />} label="Data de Nascimento" value={member.birthDate} />
                    <DetailRow icon={<CalendarCheck2 size={18} />} label="Data de Admissão" value={member.admissionDate} />
                    <DetailRow icon={<Briefcase size={18} />} label="Função na Associação" value={member.role} />
                </div>
            </Section>

            <Section title="Histórico Financeiro" icon={<DollarSign size={20}/>}>
                {transactions.length > 0 ? (
                    <ul className="space-y-2">
                        {transactions.slice(0, 5).map(t => (
                            <li key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{t.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.date}</p>
                                </div>
                                <p className={`font-semibold ${t.type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                    {t.type === 'Income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma transação encontrada para este membro.</p>
                )}
            </Section>
            
            <Section title="Participação em Eventos" icon={<CalendarCheck2 size={20} />}>
                 <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Funcionalidade em desenvolvimento.</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Em breve, será possível ver os eventos que este membro participou.</p>
                 </div>
            </Section>
        </div>

        <div className="flex justify-end pt-6 border-t dark:border-gray-700 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Fechar
            </button>
        </div>
        <style>{`
          @keyframes fade-in-scale {
            from {
              transform: scale(0.95);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-fade-in-scale {
            animation: fade-in-scale 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
          }
        `}</style>
      </div>
    </div>
  );
};