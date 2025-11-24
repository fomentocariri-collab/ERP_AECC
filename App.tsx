import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Financial } from './pages/Financial';
import { Events } from './pages/Events';
import { Documents } from './pages/Documents';
import { Communications } from './pages/Communications';
import { Settings } from './pages/Settings';
import { Page } from './types';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { Login } from './components/Login';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// Toast Notification Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-100 dark:bg-green-900/80' : 'bg-red-100 dark:bg-red-900/80';
  const borderColor = isSuccess ? 'border-green-400 dark:border-green-700' : 'border-red-400 dark:border-red-700';
  const textColor = isSuccess ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div className={`fixed top-20 right-6 p-4 rounded-lg shadow-2xl border ${bgColor} ${borderColor} ${textColor} flex items-center gap-3 z-50`}>
      <Icon className="h-5 w-5" />
      <p className="font-medium text-sm">{message}</p>
    </div>
  );
};

const App: React.FC = () => {
  const { currentUser, loading: authLoading, users, addUser, updateUser, deleteUser } = useAuth();
  
  // SENIOR UPGRADE: Usando o DataContext como única fonte de verdade.
  // Removemos toda a lógica de fetch manual e useState local daqui.
  const { 
    members, transactions, events, documents, communications,
    loading: dataLoading, 
    error: dataError,
    addMember, updateMember, deleteMember,
    addTransaction, deleteTransaction,
    addEvent, updateEvent, deleteEvent,
    addDocument, deleteDocument,
    addCommunication
  } = useData();

  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Monitora erros globais do contexto
  useEffect(() => {
    if (dataError) {
      setToast({ message: dataError, type: 'error' });
    }
  }, [dataError]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const renderPage = () => {
    if (!currentUser) return null;
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard members={members} transactions={transactions} events={events} />;
      case 'Members':
        return (
          <Members 
            members={members} 
            transactions={transactions} 
            events={events} 
            onAddMember={async (m) => { await addMember(m); showToast('Membro adicionado'); }}
            onUpdateMember={async (id, m) => { await updateMember(id, m); showToast('Membro atualizado'); }}
            onDeleteMember={async (id) => { await deleteMember(id); showToast('Membro excluído'); }}
            userRole={currentUser.role} 
          />
        );
      case 'Financial':
        return (
          <Financial 
            transactions={transactions} 
            members={members} 
            onAddTransaction={async (t) => { await addTransaction(t); showToast('Transação adicionada'); }}
            onDeleteTransaction={async (id) => { await deleteTransaction(id); showToast('Transação excluída'); }}
            userRole={currentUser.role} 
          />
        );
      case 'Events':
        return (
          <Events 
            events={events} 
            onAddEvent={async (e) => { await addEvent(e); showToast('Evento criado'); }}
            onUpdateEvent={async (id, e) => { await updateEvent(id, e); showToast('Evento atualizado'); }}
            onDeleteEvent={async (id) => { await deleteEvent(id); showToast('Evento excluído'); }}
            userRole={currentUser.role} 
          />
        );
      case 'Documents':
        return (
          <Documents 
            documents={documents} 
            onAddDocument={async (d, f) => { await addDocument(d, f); showToast('Documento enviado'); }}
            onDeleteDocument={async (d) => { await deleteDocument(d); showToast('Documento excluído'); }}
            userRole={currentUser.role} 
          />
        );
      case 'Communications':
        return (
          <Communications 
            members={members} 
            communications={communications} 
            onSendCommunication={async (c) => { await addCommunication(c); showToast('Mensagem registrada'); }}
            userRole={currentUser.role} 
          />
        );
      case 'Settings':
        return (
            <Settings 
                currentUser={currentUser} 
                users={users} 
                onUpdateUser={updateUser} 
                onAddUser={addUser} 
                onDeleteUser={deleteUser} 
                showToast={showToast} 
            />
        );
      default:
        return <Dashboard members={members} transactions={transactions} events={events} />;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-primary-700" />
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} user={currentUser} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={currentPage} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
            {dataLoading && members.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary-700" />
                <span className="ml-3 text-gray-500">Sincronizando dados...</span>
              </div>
            ) : (
              renderPage()
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default App;