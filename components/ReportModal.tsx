import React from 'react';
// FIX: Replaced non-existent 'UserClock' icon with 'Hourglass', which is a valid lucide-react icon.
import { X, Users, FileText, ArrowUp, ArrowDown, UserCheck, UserX, Hourglass } from 'lucide-react';
import { Member, Transaction } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  transactions: Transaction[];
}

// Helper to convert array of objects to CSV string
const convertToCSV = (data: any[], headers: { key: string; label: string }[]): string => {
  const headerRow = headers.map(h => h.label).join(',');
  const bodyRows = data.map(row => {
    return headers.map(header => {
      const value = row[header.key] ?? '';
      const stringValue = String(value).replace(/"/g, '""'); // Escape double quotes
      return `"${stringValue}"`;
    }).join(',');
  });
  return [headerRow, ...bodyRows].join('\n');
};

// Helper to trigger download
const downloadCSV = (csvString: string, filename: string) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const ReportButton: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; }> = ({ icon, title, subtitle, onClick }) => (
    <button onClick={onClick} className="flex items-center w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-secondary-50 dark:hover:bg-secondary-900/40 transition-colors text-left border border-gray-200 dark:border-gray-700">
        <div className="p-3 rounded-lg bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 mr-4">
            {icon}
        </div>
        <div>
            <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
    </button>
);


export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, members, transactions }) => {
  if (!isOpen) return null;

  const memberHeaders = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'admissionDate', label: 'Data de Admissão' },
    { key: 'phone', label: 'Telefone' },
    { key: 'cpf', label: 'CPF' },
    { key: 'role', label: 'Função' },
  ];
  
  const transactionHeaders = [
    { key: 'date', label: 'Data' },
    { key: 'description', label: 'Descrição' },
    { key: 'type', label: 'Tipo' },
    { key: 'amount', label: 'Valor' },
    { key: 'memberName', label: 'Membro Associado' },
  ];

  const handleDownload = (data: any[], headers: any[], baseFilename: string) => {
    const date = new Date().toISOString().split('T')[0];
    const csv = convertToCSV(data, headers);
    downloadCSV(csv, `${baseFilename}_${date}.csv`);
  };

  const getMembersByStatus = (status: Member['status']) => members.filter(m => m.status === status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Centro de Relatórios</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <div>
                <h3 className="text-lg font-medium mb-3 text-secondary-800 dark:text-secondary-300">Relatórios de Membros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReportButton icon={<Users size={20}/>} title="Lista Completa" subtitle="Todos os membros cadastrados" onClick={() => handleDownload(members, memberHeaders, 'relatorio_membros_completo')} />
                    <ReportButton icon={<UserCheck size={20}/>} title="Membros Ativos" subtitle="Apenas membros com status Ativo" onClick={() => handleDownload(getMembersByStatus('Active'), memberHeaders, 'relatorio_membros_ativos')} />
                    <ReportButton icon={<UserX size={20}/>} title="Membros Inativos" subtitle="Apenas membros com status Inativo" onClick={() => handleDownload(getMembersByStatus('Inactive'), memberHeaders, 'relatorio_membros_inativos')} />
                    <ReportButton icon={<Hourglass size={20}/>} title="Membros Pendentes" subtitle="Apenas membros com status Pendente" onClick={() => handleDownload(getMembersByStatus('Pending'), memberHeaders, 'relatorio_membros_pendentes')} />
                </div>
            </div>
             <div>
                <h3 className="text-lg font-medium mb-3 text-secondary-800 dark:text-secondary-300">Relatórios Financeiros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReportButton icon={<FileText size={20}/>} title="Histórico Completo" subtitle="Todas as receitas e despesas" onClick={() => handleDownload(transactions, transactionHeaders, 'relatorio_financeiro_completo')} />
                    <ReportButton icon={<ArrowUp size={20}/>} title="Relatório de Receitas" subtitle="Apenas as transações de entrada" onClick={() => handleDownload(transactions.filter(t => t.type === 'Income'), transactionHeaders, 'relatorio_financeiro_receitas')} />
                    <ReportButton icon={<ArrowDown size={20}/>} title="Relatório de Despesas" subtitle="Apenas as transações de saída" onClick={() => handleDownload(transactions.filter(t => t.type === 'Expense'), transactionHeaders, 'relatorio_financeiro_despesas')} />
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