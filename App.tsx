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
  
        // Check for errors in all promises
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

  const createCrudHandler = useCallback(
    (
      operationName: string,
      operation: () => Promise<{ data: any | null; error: any }>
    ) => async () => {
      try {
        const { error } = await operation();
        if (error) {
          throw error;
        }
        showToast(`${operationName} com sucesso!`);
        await fetchData(); // Refresh all data to ensure consistency
      } catch (error: any) {
        showToast(generateErrorMessage(operationName.toLowerCase(), error), 'error');
      }
    },
    [fetchData] 
  );

  const handleAddMember = async (newMemberData: Omit<Member, 'id'>) => {
    await createCrudHandler('Adicionar membro', async () => 
      supabase.from('members').insert([camelToSnake(newMemberData)]).select().single()
    )();
  };

  const handleUpdateMember = async (memberId: string, updatedData: Partial<Omit<Member, 'id'>>) => {
     await createCrudHandler('Atualizar membro', async () => 
      supabase.from('members').update(camelToSnake(updatedData)).eq('id', memberId).select().single()
    )();
  };
  
  const handleDeleteMember = async (memberId: string) => {
    await createCrudHandler('Excluir membro', async () => 
      supabase.from('members').delete().eq('id', memberId)
    )();
  };

  const handleAddTransaction = async (newTransactionData: Omit<Transaction, 'id'>) => {
    await createCrudHandler('Adicionar transação', async () => 
      supabase.from('transactions').insert([camelToSnake(newTransactionData)]).select().single()
    )();
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    await createCrudHandler('Excluir transação', async () => 
      supabase.from('transactions').delete().eq('id', transactionId)
    )();
  };
  
  const handleAddEvent = async (newEventData: Omit<Event, 'id'>) => {
    await createCrudHandler('Adicionar evento', async () => 
      supabase.from('events').insert([camelToSnake(newEventData)]).select().single()
    )();
  };

  const handleUpdateEvent = async (eventId: string, updatedData: Omit<Event, 'id'>) => {
    await createCrudHandler('Atualizar evento', async () => 
      supabase.from('events').update(camelToSnake(updatedData)).eq('id', eventId).select().single()
    )();
  };

  const handleDeleteEvent = async (eventId: string) => {
     await createCrudHandler('Excluir evento', async () => 
      supabase.from('events').delete().eq('id', eventId)
    )();
  };

  const handleAddDocument = async (docData: Omit<Document, 'id' | 'url'>, file: File) => {
    const filePath = `${currentUser!.id}/${new Date().getTime()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);

    if (uploadError) {
      showToast(generateErrorMessage('carregar arquivo', uploadError), 'error');
      return;
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
    if (!urlData.publicUrl) {
      showToast("Não foi possível obter a URL pública do arquivo.", 'error');
      await supabase.storage.from('documents').remove([filePath]);
      return;
    }

    await createCrudHandler('Adicionar documento', async () => 
      supabase.from('documents').insert([{ ...camelToSnake(docData), url: urlData.publicUrl }]).select().single()
    )();
  };

  const handleDeleteDocument = async (doc: Document) => {
    try {
        const url = new URL(doc.url);
        const filePath = url.pathname.split('/documents/')[1];
        if (filePath) {
            await supabase.storage.from('documents').remove([decodeURIComponent(filePath)]);
        }
    } catch(e) { console.error("Could not parse URL to delete from storage:", doc.url, e); }
    
    await createCrudHandler('Excluir documento', async () => 
      supabase.from('documents').delete().eq('id', doc.id)
    )();
  };
  
  const handleAddCommunication = async (newCommunicationData: Omit<Communication, 'id'>) => {
    await createCrudHandler('Enviar comunicação', async () => 
      supabase.from('communications').insert([camelToSnake(newCommunicationData)]).select().single()
    )();
  };

  const renderPage = () => {
    if (!currentUser) return null;
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard members={members} transactions={transactions} events={events} />;
      case 'Members':
        return <Members members={members} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} userRole={currentUser.role} />;
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