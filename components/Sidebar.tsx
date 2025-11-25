import React, { useState } from 'react';
import { Page, User } from '../types';
import { Home, Users, DollarSign, Calendar, FileText, Send, Settings, ChevronFirst, ChevronLast, LogOut, Briefcase, Palette, Box } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LOGO_BASE64 } from '../constants';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: <Home size={20}/>, label: 'Dashboard' },
  { name: 'Members', icon: <Users size={20}/>, label: 'Membros' },
  { name: 'Projects', icon: <Briefcase size={20}/>, label: 'Projetos' }, // Novo
  { name: 'ServiceProviders', icon: <Palette size={20}/>, label: 'Prestadores' }, // Novo
  { name: 'Financial', icon: <DollarSign size={20}/>, label: 'Financeiro' },
  { name: 'Inventory', icon: <Box size={20}/>, label: 'Patrimônio' }, // Novo
  { name: 'Events', icon: <Calendar size={20}/>, label: 'Eventos' },
  { name: 'Documents', icon: <FileText size={20}/>, label: 'Documentos' },
  { name: 'Communications', icon: <Send size={20}/>, label: 'Comunicação' },
  { name: 'Settings', icon: <Settings size={20}/>, label: 'Configurações' },
];

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, user }) => {
  const [expanded, setExpanded] = useState(true);
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <aside className="h-screen sticky top-0 z-20">
      <nav className="h-full flex flex-col bg-white dark:bg-gray-800 border-r dark:border-gray-700 shadow-sm">
        <div className="p-4 pb-2 flex justify-between items-center">
          {LOGO_BASE64 !== "[PLACEHOLDER_LOGO]" ? (
            <img src={LOGO_BASE64} alt="Logo" className={`overflow-hidden transition-all ${expanded ? 'w-32' : 'w-0'}`} />
          ) : (
            <div className={`overflow-hidden transition-all font-bold text-lg text-primary-800 dark:text-white whitespace-nowrap ${expanded ? 'w-32' : 'w-0'}`}>Associação</div>
          )}
          <button onClick={() => setExpanded(curr => !curr)} className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 ml-auto">
            {expanded ? <ChevronFirst /> : <ChevronLast />}
          </button>
        </div>

        <ul className="flex-1 px-3 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map(item => (
            <li
              key={item.name}
              onClick={() => setCurrentPage(item.name as Page)}
              className={`
                relative flex items-center py-2 px-3 my-1
                font-medium rounded-md cursor-pointer
                transition-colors group
                ${currentPage === item.name
                  ? 'bg-gradient-to-tr from-primary-200 to-primary-100 text-primary-800 dark:from-primary-900 dark:to-primary-800 dark:text-white'
                  : 'hover:bg-primary-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }
              `}
            >
              {item.icon}
              <span className={`overflow-hidden transition-all whitespace-nowrap ${expanded ? 'w-52 ml-3' : 'w-0'}`}>
                {item.label}
              </span>
              {!expanded && (
                <div className={`
                  absolute left-full rounded-md px-2 py-1 ml-6
                  bg-primary-100 text-primary-800 text-sm
                  invisible opacity-20 -translate-x-3 transition-all
                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                  dark:bg-primary-900 dark:text-primary-200 z-50 whitespace-nowrap
                `}>
                  {item.label}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="border-t dark:border-gray-700 flex flex-col p-3">
          <div className="flex items-center">
            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className={`flex justify-between items-center overflow-hidden transition-all ${ expanded ? 'w-52 ml-3' : 'w-0' }`}>
              <div className="leading-4">
                <h4 className="font-bold truncate">{user.name}</h4>
                <span className="text-xs text-gray-600 dark:text-gray-400">{user.role}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className={`
              relative flex items-center justify-start w-full py-2 px-3 mt-4
              font-medium rounded-md cursor-pointer
              transition-colors group
              bg-gray-100 hover:bg-red-100 text-gray-800 hover:text-red-700
              dark:bg-gray-700 dark:hover:bg-red-900/50 dark:text-gray-300 dark:hover:text-red-300
            `}
          >
            <LogOut size={20} />
            <span className={`overflow-hidden transition-all whitespace-nowrap ${expanded ? 'w-auto ml-3' : 'w-0'}`}>Sair</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};