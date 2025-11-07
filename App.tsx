import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Financial } from './pages/Financial';
import { Events } from './pages/Events';
import { Documents } from './pages/Documents';
import { Communications } from './pages/Communications';
import { Settings } from './pages/Settings';
import { Page, Member, Transaction, Event, Document, Communication } from './types';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { supabase } from './supabaseClient';
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

// Helper function to convert object keys from snake_case to camelCase
const snakeToCamel = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(v => snakeToCamel(v));
  }
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {} as { [key: string]: any });
};

// Helper function to convert object keys from camelCase to snake_case
const camelToSnake = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(v => camelToSnake(v));
  }
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {} as { [key: string]: any });
};

const App: React.FC = () => {
  const { currentUser, loading, users, addUser, updateUser, deleteUser } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [appLoading, setAppLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };
  
  const generateErrorMessage = (action: string, error: any) => {
    return `Erro ao ${action}: ${error.message}. Verifique as permissões (RLS) no Supabase.`;
  };

  const fetchData = useCallback(async () => {
      if (!currentUser) {
          setAppLoading(false);
          return;
      };
      
      setAppLoading(true);
      try {
        const [membersRes, transactionsRes, eventsRes, documentsRes, communicationsRes] = await Promise.all([
          supabase.from('members').select('*').order('name', { ascending: true }),
          supabase.from('transactions').select('*').order('date', { ascending: false }),
          supabase.from('events').select('*').order('date', { ascending: false }),
          supabase.from('documents').select('*').order('upload_date', { ascending: false }),
          supabase.from('communications').select('*').order('sent_at', { ascending: false })
        ]);
  
        const errors = [membersRes, transactionsRes, eventsRes, documentsRes, communicationsRes].map(res => res.error).filter(Boolean);
        if (errors.length > 0) {
          throw new Error(errors.map(e => e!.message).join(', '));
        }
  
        setMembers(snakeToCamel(membersRes.data) as Member[]);
        setTransactions(snakeToCamel(transactionsRes.data) as Transaction[]);
        setEvents(snakeToCamel(eventsRes.data) as Event[]);
        setDocuments(snakeToCamel(documentsRes.data) as Document[]);
        setCommunications(snakeToCamel(communicationsRes.data) as Communication[]);
  
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
        showToast(`Falha ao carregar dados: ${error.message}`, 'error');
      } finally {
        setAppLoading(false);
      }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    } else {
      setMembers([]);
      setTransactions([]);
      setEvents([]);
      setDocuments([]);
      setCommunications([]);
      setAppLoading(false);
    }
  }, [currentUser, fetchData]);

  // Generic CRUD Handler
  const handleCrudOperation = async (
    action: string,
    operation: () => Promise<{ error: any }>,
    throwOnError = false
  ) => {
    try {
      const { error } = await operation();
      if (error) throw error;
      showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} com sucesso!`);
      await fetchData();
    } catch (error: any) {
      showToast(generateErrorMessage(action.toLowerCase(), error), 'error');
      if (throwOnError) {
        throw error;
      }
    }
  };

  const handleAddMember = async (newMemberData: Omit<Member, 'id'>) => {
    await handleCrudOperation('adicionar membro', async () => supabase.from('members').insert([camelToSnake(newMemberData)]), true);
  };

  const handleUpdateMember = async (memberId: string, updatedData: Partial<Omit<Member, 'id'>>) => {
    await handleCrudOperation('atualizar membro', async () => supabase.from('members').update(camelToSnake(updatedData)).eq('id', memberId), true);
  };
  
  const handleDeleteMember = async (memberId: string) => {
    await handleCrudOperation('excluir membro', async () => supabase.from('members').delete().eq('id', memberId));
  };

  const handleAddTransaction = async (newTransactionData: Omit<Transaction, 'id'>) => {
    await handleCrudOperation('adicionar transação', async () => supabase.from('transactions').insert([camelToSnake(newTransactionData)]), true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    await handleCrudOperation('excluir transação', async () => supabase.from('transactions').delete().eq('id', transactionId));
  };
  
  const handleAddEvent = async (newEventData: Omit<Event, 'id'>) => {
    await handleCrudOperation('adicionar evento', async () => supabase.from('events').insert([camelToSnake(newEventData)]), true);
  };

  const handleUpdateEvent = async (eventId: string, updatedData: Omit<Event, 'id'>) => {
    await handleCrudOperation('atualizar evento', async () => supabase.from('events').update(camelToSnake(updatedData)).eq('id', eventId), true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await handleCrudOperation('excluir evento', async () => supabase.from('events').delete().eq('id', eventId));
  };

  const handleAddDocument = async (docData: Omit<Document, 'id' | 'url'>, file: File) => {
    try {
      const filePath = `${currentUser!.id}/${new Date().getTime()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      if (!urlData.publicUrl) throw new Error("Não foi possível obter a URL pública do arquivo.");

      await handleCrudOperation('adicionar documento', async () => supabase.from('documents').insert([{ ...camelToSnake(docData), url: urlData.publicUrl }]), true);
    } catch (error: any) {
      showToast(generateErrorMessage('adicionar documento', error), 'error');
      throw error;
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    try {
      const url = new URL(doc.url);
      const filePath = url.pathname.split('/documents/')[1];
      if (filePath) {
          await supabase.storage.from('documents').remove([decodeURIComponent(filePath)]);
      }
    } catch(e) { console.error("Could not parse URL to delete from storage:", doc.url, e); }
    
    await handleCrudOperation('excluir documento', async () => supabase.from('documents').delete().eq('id', doc.id));
  };
  
  const handleAddCommunication = async (newCommunicationData: Omit<Communication, 'id'>) => {
    await handleCrudOperation('enviar comunicação', async () => supabase.from('communications').insert([camelToSnake(newCommunicationData)]), true);
  };

  const renderPage = () => {
    if (!currentUser) return null;
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard members={members} transactions={transactions} events={events} />;
      case 'Members':
        return <Members members={members} transactions={transactions} events={events} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} userRole={currentUser.role} />;
      case 'Financial':
        return <Financial transactions={transactions} members={members} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} userRole={currentUser.role} />;
      case 'Events':
        return <Events events={events} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent} userRole={currentUser.role} />;
      case 'Documents':
        return <Documents documents={documents} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} userRole={currentUser.role} />;
      case 'Communications':
        return <Communications members={members} communications={communications} onAddCommunication={handleAddCommunication} userRole={currentUser.role} />;
      case 'Settings':
        return <Settings currentUser={currentUser} users={users} onUpdateUser={updateUser} onAddUser={addUser} onDeleteUser={deleteUser} showToast={showToast} />;
      default:
        return <Dashboard members={members} transactions={transactions} events={events} />;
    }
  };

  if (loading) {
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
            {appLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary-700" />
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