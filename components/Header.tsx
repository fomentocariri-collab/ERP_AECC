import React from 'react';
import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-16 bg-white dark:bg-gray-800 shadow-md dark:border-b dark:border-gray-700 flex items-center justify-between px-6 z-10">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <Bell size={20} />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
        </button>
      </div>
    </header>
  );
};