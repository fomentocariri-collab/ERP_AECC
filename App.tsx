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
    const timer = setTimeout(onClose, 8000); // Increased time for detailed errors
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-100 dark:bg-green-900/80' : 'bg-red-100 dark:bg-red-900/80';
  const borderColor = isSuccess ? 'border-green-400 dark:border-green-700' : 'border-red-400 dark:border-red-700';
  const textColor = isSuccess ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div className={`fixed top-20 right-6 p-4 rounded-lg shadow-2xl border ${bgColor} ${borderColor} ${textColor} flex items-center gap-3 z-50 max-w-md`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
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
  const { currentUser, loading, users, addUser, updateUser, deleteUser, logout } = useAuth();
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
    console.error(`Detailed error on "${action}":`, error);
    
    // Specific check for corrupted refresh token
    if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('Invalid Refresh Token')) {
        return `Sua sessão está corrompida. Por favor, limpe os dados de navegação e faça login novamente.`;
    }

    // Network Error (CORS, Firewall, Offline)
    if (error.message === 'Failed to fetch') {
      return `Erro de rede ao ${action}. Verifique sua conexão, firewall, ou extensões do navegador (ex: AdBlock).`;
    }

    // Supabase Auth Error (e.g., JWT expired)
    if (error.code === 'PGRST301' || error.status === 401 || (error.message && (error.message.includes('JWT') || error.message.includes('token')))) {
      return 'Sua sessão expirou. Por favor, faça login novamente.';
    }

    // Supabase RLS (Row Level Security) Error
    if (error.code === '42501' || (error.message && error.message.includes('violates row-level security policy'))) {
        return `Erro de permissão ao ${action}. Verifique as Políticas de Acesso (RLS) da tabela no Supabase.`;
    }
    
    // Supabase Storage Error
    if (action.includes('storage') || action.includes('arquivo') || action.includes('avatar')) {
        return `Erro de Storage ao ${action}: ${error.message}. Verifique as Políticas de Acesso (Policies) do Storage no Supabase.`;
    }

    // Supabase Edge Function Error
    if (action.includes('e-mail') || action.includes('usuário')) {
        return `Erro na Edge Function ao ${action}: ${error.message}. Verifique os logs da função no painel do Supabase.`;
    }

    // Default detailed message
    return `Erro ao ${action}: ${error.message || 'Ocorreu um erro desconhecido.'} (Code: ${error.code || 'N/A'})`;
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
          // Throw the first error to be handled by the catch block
          throw errors[0];
        }
  
        setMembers(snakeToCamel(membersRes.data) as Member[]);
        setTransactions(snakeToCamel(transactionsRes.data) as Transaction[]);
        setEvents(snakeToCamel(eventsRes.data) as Event[]);
        setDocuments(snakeToCamel(documentsRes.data) as Document[]);
        setCommunications(snakeToCamel(communicationsRes.data) as Communication[]);
  
      } catch (error: any) {
        const errorMessage = generateErrorMessage('carregar dados', error);
        showToast(errorMessage, 'error');

        // Check if it's an authentication error that requires logout
        const isAuthError = error.code === 'PGRST301' || error.status === 401 || 
                            (error.message && (error.message.includes('JWT') || 
                                              error.message.includes('token') || 
                                              error.message.includes('Invalid Refresh Token')));

        if (isAuthError) {
          // The session is invalid or expired. Force a logout so the user can log in again with a fresh session.
          setTimeout(() => logout(), 3000); 
        }
      } finally {
        setAppLoading(false);
      }
  }, [currentUser, logout]);

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

  // Generic CRUD Handler for simple operations
  const handleCrudOperation = async (
    action: string,
    operation: () => Promise<{ error: any | null }>,
    throwOnError = false
  ) => {
    try {
      const { error } = await operation();
      if (error) throw error; 

      showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} com sucesso!`);
      await fetchData();
    } catch (error: any) {
      const isAuthError = error.code === 'PGRST301' || error.status === 401 || (error.message && (error.message.includes('JWT') || error.message.includes('token')));

      if (isAuthError) {
        showToast(generateErrorMessage(action.toLowerCase(), error), 'error');
        setTimeout(() => logout(), 2500); 
      } else {
        showToast(generateErrorMessage(action.toLowerCase(), error), 'error');
      }

      if (throwOnError) {
        throw error;
      }
    }
  };
  
  const handleAddMember = async (data: { memberData: Omit<Member, 'id' | 'avatarUrl'>, avatarFile: File | null }) => {
    try {
      // FIX: The `memberData` type is `Omit<Member, 'id' | 'avatarUrl'>`, so `avatarUrl` cannot be accessed from it.
      let avatarUrl = `https://i.pravatar.cc/150?u=${data.memberData.email}`;
      
      // 1. Upload avatar if provided
      if (data.avatarFile) {
        const filePath = `${currentUser!.id}/avatars/${new Date().getTime()}-${data.avatarFile.name}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, data.avatarFile);
        if (uploadError) throw { ...uploadError, context: 'storage' };

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (!urlData.publicUrl) throw { message: "Could not get public URL for avatar" };
        avatarUrl = urlData.publicUrl;
      }
      
      // 2. Insert member into database
      const memberRecord = { ...data.memberData, avatarUrl };
      const { error: dbError } = await supabase.from('members').insert([camelToSnake(memberRecord)]).select().single();
      if (dbError) throw { ...dbError, context: 'database' };
      
      showToast('Membro adicionado com sucesso!');
      await fetchData();
    } catch (error: any) {
      const action = error.context === 'storage' ? 'carregar avatar para o storage' : 'adicionar membro';
      showToast(generateErrorMessage(action, error), 'error');
      throw error;
    }
  };
  
  const handleUpdateMember = async (memberId: string, data: { memberData: Partial<Omit<Member, 'id'>>, avatarFile: File | null }) => {
    try {
      const memberToUpdate = members.find(m => m.id === memberId);
      if (!memberToUpdate) throw new Error("Member not found");

      let finalMemberData = { ...data.memberData };

      // 1. Upload new avatar if provided
      if (data.avatarFile) {
        const filePath = `${currentUser!.id}/avatars/${new Date().getTime()}-${data.avatarFile.name}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, data.avatarFile);
        if (uploadError) throw { ...uploadError, context: 'storage' };

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (!urlData.publicUrl) throw { message: "Could not get public URL for new avatar" };
        (finalMemberData as Partial<Member>).avatarUrl = urlData.publicUrl;

        // 2. Delete old avatar from storage if it exists and is a storage URL
        if (memberToUpdate.avatarUrl && memberToUpdate.avatarUrl.includes(supabase.storage.from('avatars').getPublicUrl('').data.publicUrl)) {
            const oldFilePath = memberToUpdate.avatarUrl.split('/').slice(-2).join('/');
            await supabase.storage.from('avatars').remove([oldFilePath]);
        }
      }

      // 3. Update member in database
      const { error: dbError } = await supabase.from('members').update(camelToSnake(finalMemberData)).eq('id', memberId).select().single();
      if (dbError) throw { ...dbError, context: 'database' };
      
      showToast('Membro atualizado com sucesso!');
      await fetchData();
    } catch (error: any) {
      const action = error.context === 'storage' ? 'atualizar avatar no storage' : 'atualizar membro';
      showToast(generateErrorMessage(action, error), 'error');
      throw error;
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    await handleCrudOperation('excluir membro', async () => supabase.from('members').delete().eq('id', memberId));
  };

  const handleAddTransaction = async (newTransactionData: Omit<Transaction, 'id'>) => {
    await handleCrudOperation('adicionar transação', async () => supabase.from('transactions').insert([camelToSnake(newTransactionData)]).select().single(), true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    await handleCrudOperation('excluir transação', async () => supabase.from('transactions').delete().eq('id', transactionId));
  };
  
  const handleAddEvent = async (newEventData: Omit<Event, 'id'>) => {
    await handleCrudOperation('adicionar evento', async () => supabase.from('events').insert([camelToSnake(newEventData)]).select().single(), true);
  };

  const handleUpdateEvent = async (eventId: string, updatedData: Omit<Event, 'id'>) => {
    await handleCrudOperation('atualizar evento', async () => supabase.from('events').update(camelToSnake(updatedData)).eq('id', eventId).select().single(), true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await handleCrudOperation('excluir evento', async () => supabase.from('events').delete().eq('id', eventId));
  };

  const handleAddDocument = async (docData: Omit<Document, 'id' | 'url'>, file: File) => {
    const filePath = `${currentUser!.id}/${new Date().getTime()}-${file.name}`;
    try {
      // 1. Upload file to storage
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) {
        throw { ...uploadError, context: 'storage' };
      }

      // 2. Get public URL
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      if (!urlData.publicUrl) {
          await supabase.storage.from('documents').remove([filePath]);
          throw { message: "Não foi possível obter a URL pública do arquivo.", context: 'url' };
      }

      // 3. Insert metadata into database
      const dbRecord = { ...camelToSnake(docData), url: urlData.publicUrl };
      const { error: dbError } = await supabase.from('documents').insert([dbRecord]).select().single();
      if (dbError) {
        await supabase.storage.from('documents').remove([filePath]); // Cleanup
        throw { ...dbError, context: 'database' };
      }
      
      // 4. Success
      showToast('Documento adicionado com sucesso!');
      await fetchData();

    } catch (error: any) {
        let action = 'adicionar documento';
        if (error.context === 'storage') action = 'carregar arquivo para o storage';
        else if (error.context === 'url') action = 'obter URL pública';
        else if (error.context === 'database') action = 'salvar informações do documento';
        
        showToast(generateErrorMessage(action, error), 'error');
        throw error; // Re-throw to be caught by the modal
    }
  };


  const handleDeleteDocument = async (doc: Document) => {
    try {
      const url = new URL(doc.url);
      const filePath = url.pathname.split('/documents/')[1];
      if (filePath) {
          const { error: storageError } = await supabase.storage.from('documents').remove([decodeURIComponent(filePath)]);
          if (storageError) console.error("Ignorable storage error on delete:", storageError.message);
      }
    } catch(e) { console.error("Could not parse URL to delete from storage:", doc.url, e); }
    
    await handleCrudOperation('excluir documento', async () => supabase.from('documents').delete().eq('id', doc.id));
  };
  
  const handleSendCommunication = async (
    communicationData: Omit<Communication, 'id'>,
    recipientEmails: string[]
  ) => {
    // 1. Save communication to history
    await handleCrudOperation('salvar comunicação', async () =>
      supabase.from('communications').insert([camelToSnake(communicationData)]).select().single()
    , true);

    // 2. Invoke Edge Function to send emails
    if (recipientEmails.length > 0) {
      try {
        const { error } = await supabase.functions.invoke('send-email', {
          body: {
            recipients: recipientEmails,
            subject: communicationData.subject,
            message: communicationData.message
          },
        });

        if (error) throw error;
        showToast('E-mails enviados para a fila de disparo!');
      } catch (error: any) {
        showToast(generateErrorMessage('enviar e-mail', error), 'error');
        // Do not re-throw, as the communication was already saved.
      }
    }
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
        return <Communications members={members} communications={communications} onSendCommunication={handleSendCommunication} userRole={currentUser.role} />;
      case 'Settings':
        return <Settings currentUser={currentUser} users={users} onUpdateUser={updateUser} onAddUser={addUser} onDeleteUser={deleteUser} showToast={showToast} />;
      default:
        return <Dashboard members={members} transactions={transactions} events={events} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-secondary-700" />
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
                <Loader2 className="h-12 w-12 animate-spin text-secondary-700" />
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