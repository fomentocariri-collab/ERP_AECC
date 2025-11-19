import React from 'react';
import { Users, UserCheck, Calendar, DollarSign, UserX, CalendarOff, TrendingUp, TrendingDown } from 'lucide-react';
import { Member, Transaction, Event } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; }> = ({ icon, title, value }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-start justify-between border border-gray-200 dark:border-gray-700">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
    <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full">
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

  // Prepare data for charts
  const financialData = transactions.reduce((acc, curr) => {
    const month = new Date(curr.date).toLocaleString('default', { month: 'short' });
    const existing = acc.find(a => a.name === month);
    if (existing) {
        if(curr.type === 'Income') existing.income += curr.amount;
        else existing.expense += curr.amount;
    } else {
        acc.push({ 
            name: month, 
            income: curr.type === 'Income' ? curr.amount : 0, 
            expense: curr.type === 'Expense' ? curr.amount : 0 
        });
    }
    return acc;
  }, [] as any[]).slice(0, 6).reverse(); // Last 6 months

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-primary-700 dark:text-primary-300"/>} title="Total de Membros" value={members.length.toString()} />
        <StatCard icon={<UserCheck className="text-primary-700 dark:text-primary-300"/>} title="Membros Ativos" value={activeMembers.toString()} />
        <StatCard icon={<Calendar className="text-primary-700 dark:text-primary-300"/>} title="Próximos Eventos" value={events.length.toString()} />
        <StatCard icon={<DollarSign className="text-primary-700 dark:text-primary-300"/>} title="Receita do Mês" value={`R$ ${monthlyIncome.toFixed(2)}`} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-80">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-green-500"/> Fluxo de Caixa (Últimos 6 Meses)
            </h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                        itemStyle={{ color: '#F3F4F6' }}
                    />
                    <Bar dataKey="income" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-80">
             <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <TrendingDown size={20} className="text-blue-500"/> Balanço Financeiro
            </h3>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData}>
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}/>
                    <Area type="monotone" dataKey="income" stroke="#3B82F6" fillOpacity={1} fill="url(#colorIncome)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
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
                <div key={event.id} className="border-l-4 border-primary-500 pl-4 py-1">
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