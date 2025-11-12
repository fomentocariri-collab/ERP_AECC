import React from 'react';
import { Users, UserCheck, Calendar, DollarSign, UserX, CalendarOff } from 'lucide-react';
import { Member, Transaction, Event } from '../types';
import { LOGO_AECC_BASE64, PROJECT_NAME } from '../constants';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: 'primary' | 'secondary' }> = ({ icon, title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-start justify-between border border-gray-200 dark:border-gray-700">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${color === 'primary' ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-secondary-100 dark:bg-secondary-900/50'}`}>
      {icon}
    </div>
  </div>
);

interface DashboardProps {
  members: Member[];
  transactions: Transaction[];
  events: Event[];
}

export const Dashboard: React.FC<DashboardProps> = ({ members, transactions, events }) => {
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const monthlyIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-6">
        <img src={LOGO_AECC_BASE64} alt="Logo da AECC" className="h-20 w-20" />
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bem-vindo ao painel de gerenciamento da</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{PROJECT_NAME}</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard color="secondary" icon={<Users className="text-secondary-700 dark:text-secondary-300"/>} title="Total de Membros" value={members.length.toString()} />
        <StatCard color="primary" icon={<UserCheck className="text-primary-700 dark:text-primary-300"/>} title="Membros Ativos" value={activeMembers.toString()} />
        <StatCard color="secondary" icon={<Calendar className="text-secondary-700 dark:text-secondary-300"/>} title="Próximos Eventos" value={events.length.toString()} />
        <StatCard color="primary" icon={<DollarSign className="text-primary-700 dark:text-primary-300"/>} title="Receita do Mês" value={`R$ ${monthlyIncome.toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Membros Recentes</h2>
          <div className="space-y-4">
            {members.length > 0 ? members.slice(-4).reverse().map(member => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full"/>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{member.admissionDate}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserX size={40} className="mx-auto mb-2" />
                <p>Nenhum membro cadastrado.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Próximos Eventos</h2>
          <div className="space-y-4">
            {events.length > 0 ? events.slice(-3).reverse().map(event => (
                <div key={event.id} className="border-l-4 border-secondary-500 pl-4 py-1">
                    <p className="font-semibold text-sm">{event.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{event.date} - {event.location}</p>
                </div>
            )) : (
                 <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CalendarOff size={40} className="mx-auto mb-2" />
                    <p>Nenhum evento agendado.</p>
                  </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
