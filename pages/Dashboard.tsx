import React, { useMemo } from 'react';
import { Users, UserCheck, Calendar, DollarSign, CalendarOff, TrendingUp, TrendingDown, UserX } from 'lucide-react';
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

  // SENIOR UPGRADE: Data processing for charts using useMemo for performance
  const financialData = useMemo(() => {
    const data: Record<string, { name: string; income: number; expense: number }> = {};
    
    // Process last 6 months
    transactions.forEach(t => {
        const date = new Date(t.date);
        const key = `${date.getMonth()}-${date.getFullYear()}`;
        const name = date.toLocaleString('default', { month: 'short' });
        
        if (!data[key]) {
            data[key] = { name, income: 0, expense: 0 };
        }
        
        if (t.type === 'Income') data[key].income += t.amount;
        else data[key].expense += t.amount;
    });

    return Object.values(data).slice(0, 6).reverse();
  }, [transactions]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-primary-700 dark:text-primary-300"/>} title="Total de Membros" value={members.length.toString()} />
        <StatCard icon={<UserCheck className="text-primary-700 dark:text-primary-300"/>} title="Membros Ativos" value={activeMembers.toString()} />
        <StatCard icon={<Calendar className="text-primary-700 dark:text-primary-300"/>} title="Próximos Eventos" value={events.length.toString()} />
        <StatCard icon={<DollarSign className="text-primary-700 dark:text-primary-300"/>} title="Receita Total" value={`R$ ${monthlyIncome.toFixed(0)}`} />
      </div>

      {/* SENIOR UPGRADE: Visualização de Dados com Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-96">
            <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-green-500"/> Fluxo de Caixa (Receita vs Despesa)
            </h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                        cursor={{fill: 'transparent'}}
                    />
                    <Bar dataKey="income" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="expense" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-96">
             <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                <TrendingDown size={20} className="text-blue-500"/> Tendência de Receita
            </h3>
             <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={financialData}>
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`}/>
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}/>
                    <Area type="monotone" dataKey="income" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Membros Recentes</h2>
          <div className="space-y-4">
            {members.length > 0 ? members.slice(-4).reverse().map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600"/>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{new Date(member.admissionDate).toLocaleDateString()}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserX size={40} className="mx-auto mb-2 opacity-50" />
                <p>Nenhum membro cadastrado.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Próximos Eventos</h2>
          <div className="space-y-4">
            {events.length > 0 ? events.slice(-3).reverse().map(event => (
                <div key={event.id} className="border-l-4 border-primary-500 pl-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-r-lg">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{event.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(event.date).toLocaleDateString()} - {event.location}</p>
                </div>
            )) : (
                 <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CalendarOff size={40} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum evento agendado.</p>
                  </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};