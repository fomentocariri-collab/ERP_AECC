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
import { Loader2 } from 'lucide-react';

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
  
  // App data state
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [appLoading, setAppLoading] = useState(true);

  const generateErrorMessage = (action: string, error: any) => {
    return `Erro ao ${action}: ${error.message}\n\nIsso geralmente acontece por falta de permissão no banco de dados. Verifique as políticas de segurança (RLS) no painel do Supabase para esta tabela.`;
  };

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setAppLoading(true);
    try {
      const [membersRes, transactionsRes, eventsRes, documentsRes, communicationsRes] = await Promise.all([
        supabase.from('members').select('*').order('name', { ascending: true }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('documents').select('*').order('upload_date', { ascending: false }),
        supabase.from('communications').select('*').order('sent_at', { ascending: false })
      ]);

      if (membersRes.error) throw membersRes.error;
      setMembers(snakeToCamel(membersRes.data) as Member[]);

      if (transactionsRes.error) throw transactionsRes.error;
      setTransactions(snakeToCamel(transactionsRes.data) as Transaction[]);
      
      if (eventsRes.error) throw eventsRes.error;
      setEvents(snakeToCamel(eventsRes.data) as Event[]);
      
      if (documentsRes.error) throw documentsRes.error;
      setDocuments(snakeToCamel(documentsRes.data) as Document[]);
      
      if (communicationsRes.error) throw communicationsRes.error;
      setCommunications(snakeToCamel(communicationsRes.data) as Communication[]);

    } catch (error: any) {
      console.error("Error fetching data:", error.message);
    } finally {
      setAppLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CRUD Handlers
  const handleAddMember = async (newMemberData: Omit<Member, 'id'>) => {
    const { data, error } = await supabase
      .from('members')
      .insert([camelToSnake(newMemberData)])
      .select()
      .single();

    if (error) {
      console.error('Error adding member:', error);
      alert(generateErrorMessage('adicionar membro', error));
    } else if (data) {
      setMembers(prev => [snakeToCamel(data) as Member, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const handleUpdateMember = async (memberId: string, updatedData: Omit<Member, 'id'>) => {
    const { data, error } = await supabase
      .from('members')
      .update(camelToSnake(updatedData))
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      alert(generateErrorMessage('atualizar membro', error));
    } else if (data) {
      setMembers(prev => prev.map(m => m.id === memberId ? snakeToCamel(data) as Member : m));
    }
  };
  
  const handleDeleteMember = async (memberId: string) => {
    const { error } = await supabase.from('members').delete().eq('id', memberId);
    if (error) {
      console.error('Error deleting member:', error);
      alert(generateErrorMessage('excluir membro', error));
    } else {
      setMembers(prev => prev.filter(m => m.id !== memberId));
    }
  };
  
  const handleAddTransaction = async (newTransactionData: Omit<Transaction, 'id'>) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([camelToSnake(newTransactionData)])
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      alert(generateErrorMessage('adicionar transação', error));
    } else if (data) {
      setTransactions(prev => [snakeToCamel(data) as Transaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) {
      console.error('Error deleting transaction:', error);
      alert(generateErrorMessage('excluir transação', error));
    } else {
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    }
  };

  const handleAddEvent = async (newEventData: Omit<Event, 'id'>) => {
    const { data, error } = await supabase.from('events').insert([camelToSnake(newEventData)]).select().single();
    if (error) {
      console.error('Error adding event:', error);
      alert(generateErrorMessage('adicionar evento', error));
    } else if (data) {
      setEvents(prev => [snakeToCamel(data) as Event, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const handleUpdateEvent = async (eventId: string, updatedData: Omit<Event, 'id'>) => {
    const { data, error } = await supabase.from('events').update(camelToSnake(updatedData)).eq('id', eventId).select().single();
    if (error) {
      console.error('Error updating event:', error);
      alert(generateErrorMessage('atualizar evento', error));
    } else if (data) {
      setEvents(prev => prev.map(e => e.id === eventId ? snakeToCamel(data) as Event : e));
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
     if (error) {
      console.error('Error deleting event:', error);
      alert(generateErrorMessage('excluir evento', error));
    } else {
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  const handleAddDocument = async (docData: Omit<Document, 'id' | 'url'>, file: File) => {
     const filePath = `${currentUser!.id}/${Date.now()}_${file.name}`;
     const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
     
     if (uploadError) {
       console.error("Error uploading document:", uploadError);
       alert(generateErrorMessage('fazer upload do documento (Storage)', uploadError));
       return;
     }

     const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
     
     if (!urlData?.publicUrl) {
        console.error("Could not get public URL for uploaded file:", filePath);
        alert("Erro Crítico: Não foi possível obter a URL pública para o arquivo após o upload. Verifique se o bucket 'documents' no Supabase é público.");
        // Attempt to clean up the orphaned file
        await supabase.storage.from('documents').remove([filePath]);
        return;
     }
     
     const documentToInsert = {
        ...docData,
        url: urlData.publicUrl,
     };

     const { data, error } = await supabase
        .from('documents')
        .insert([camelToSnake(documentToInsert)])
        .select()
        .single();

     if (error) {
       console.error("Error saving document record:", error);
       alert(generateErrorMessage('salvar registro do documento (Database)', error));
     } else if (data) {
       setDocuments(prev => [snakeToCamel(data) as Document, ...prev]);
     }
  };

  const handleDeleteDocument = async (document: Document) => {
    // Extract file path from URL
    const url = new URL(document.url);
    const filePath = url.pathname.split('/documents/')[1];

    const { error: storageError } = await supabase.storage.from('documents').remove([decodeURIComponent(filePath)]);
    if (storageError) {
      console.error("Error deleting from storage:", storageError);
      // Do not alert if file not found, it might have been deleted manually
      if (storageError.message !== 'The resource was not found') {
        alert(generateErrorMessage('excluir arquivo do Storage', storageError));
      }
    }

    const { error } = await supabase.from('documents').delete().eq('id', document.id);
    if (error) {
      console.error("Error deleting document record:", error);
      alert(generateErrorMessage('excluir registro do documento', error));
    } else {
      setDocuments(prev => prev.filter(d => d.id !== document.id));
    }
  };
  
  const handleAddCommunication = async (newCommunicationData: Omit<Communication, 'id'>) => {
    const { data, error } = await supabase
      .from('communications')
      .insert([camelToSnake(newCommunicationData)])
      .select()
      .single();

    if (error) {
      console.error("Error adding communication:", error);
      alert(generateErrorMessage('adicionar comunicação', error));
    } else if (data) {
      setCommunications(prev => [snakeToCamel(data) as Communication, ...prev]);
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="animate-spin text-primary-700" size={48} />
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }
  
  if (appLoading) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
            <Loader2 className="animate-spin text-primary-700 mx-auto" size={48} />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando dados da associação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        user={currentUser}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentPage} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
          <div className={currentPage === 'Dashboard' ? '' : 'hidden'}>
            <Dashboard members={members} transactions={transactions} events={events} />
          </div>
          <div className={currentPage === 'Members' ? '' : 'hidden'}>
            <Members 
              members={members} 
              onAddMember={handleAddMember} 
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              userRole={currentUser.role} 
            />
          </div>
          <div className={currentPage === 'Financial' ? '' : 'hidden'}>
            <Financial 
              transactions={transactions} 
              members={members} 
              onAddTransaction={handleAddTransaction} 
              onDeleteTransaction={handleDeleteTransaction}
              userRole={currentUser.role} 
            />
          </div>
          <div className={currentPage === 'Events' ? '' : 'hidden'}>
            <Events 
              events={events} 
              onAddEvent={handleAddEvent} 
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              userRole={currentUser.role} 
            />
          </div>
          <div className={currentPage === 'Documents' ? '' : 'hidden'}>
            <Documents documents={documents} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} userRole={currentUser.role} />
          </div>
          <div className={currentPage === 'Communications' ? '' : 'hidden'}>
            <Communications members={members} communications={communications} onAddCommunication={handleAddCommunication} userRole={currentUser.role} />
          </div>
          <div className={currentPage === 'Settings' ? '' : 'hidden'}>
            <Settings currentUser={currentUser} users={users} onUpdateUser={updateUser} onAddUser={addUser} onDeleteUser={deleteUser} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
