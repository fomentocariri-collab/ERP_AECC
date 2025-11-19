import React, { useState } from 'react';
import { PlusCircle, Download, ArrowUpCircle, ArrowDownCircle, Receipt, Trash2, Sparkles } from 'lucide-react';
import { Transaction, Member, UserRole } from '../types';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { ReportModal } from '../components/ReportModal';
import { AIAnalysisModal } from '../components/AIAnalysisModal';

interface FinancialProps {
    transactions: Transaction[];
    members: Member[];
    onAddTransaction: (newTransaction: Omit<Transaction, 'id'>) => Promise<void>;
    onDeleteTransaction: (transactionId: string) => Promise<void>;
    userRole: UserRole;
}

export const Financial: React.FC<FinancialProps> = ({ transactions, members, onAddTransaction, onDeleteTransaction, userRole }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const canPerformActions = userRole === 'Super Admin' || userRole === 'Financeiro';

    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    
    const handleDelete = async (transactionId: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
            await onDeleteTransaction(transactionId);
        }
    };

    const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => (
        <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                <div className="flex items-center gap-3">
                    {transaction.type === 'Income'
                        ? <ArrowUpCircle className="text-green-500" />
                        : <ArrowDownCircle className="text-red-500" />
                    }
                    <div>
                        <p>{transaction.description}</p>
                        {transaction.memberName && (
                             <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.memberName}</p>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">{transaction.date}</td>
            <td className={`px-6 py-4 font-semibold ${transaction.type === 'Income' ? 'text-green-500' : 'text-red-500'}`}>
                {transaction.type === 'Income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
            </td>
            {canPerformActions && (
                <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(transaction.id)} className="p-2 text-gray-500 hover:text-primary-700 dark:hover:text-primary-500">
                        <Trash2 size={16} />
                    </button>
                </td>
            )}
        </tr>
    );

    return (
        <>
        <AddTransactionModal 
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAddTransaction={onAddTransaction}
            members={members}
        />
        <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            members={members}
            transactions={transactions}
        />
        <AIAnalysisModal 
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            transactions={transactions}
        />

        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-100 dark:bg-green-900/50 p-6 rounded-xl text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                    <h3 className="font-medium">Receita Total</h3>
                    <p className="text-3xl font-bold">R$ {totalIncome.toFixed(2)}</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/50 p-6 rounded-xl text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                    <h3 className="font-medium">Despesa Total</h3>
                    <p className="text-3xl font-bold">R$ {totalExpense.toFixed(2)}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/50 p-6 rounded-xl text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium">Saldo</h3>
                    <p className="text-3xl font-bold">R$ {balance.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold">Transações Recentes</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <button 
                            onClick={() => setIsAIModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 shadow-md transition-all"
                        >
                            <Sparkles size={16} /> Análise IA
                        </button>
                        {canPerformActions && (
                            <>
                                <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                                    <Download size={16} /> Relatórios
                                </button>
                                <button 
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800">
                                    <PlusCircle size={16} /> Nova Transação
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Descrição</th>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Valor</th>
                                {canPerformActions && <th scope="col" className="px-6 py-3 text-right">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                             {transactions.length > 0 ? (
                                transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)
                            ) : (
                                <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                    <td colSpan={canPerformActions ? 4 : 3} className="text-center py-10">
                                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                            <Receipt size={48} className="mb-2" />
                                            <h3 className="text-lg font-semibold">Nenhuma transação encontrada</h3>
                                            <p className="text-sm">Comece adicionando a primeira transação financeira.</p>
                                        </div>
                                    </td>
                                </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </>
    );
};