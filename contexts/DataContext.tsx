import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Member, Transaction, Event, Document, Communication } from '../types';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

// Utilitários de conversão de case (mantidos aqui para uso interno do provider)
const snakeToCamel = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(v => snakeToCamel(v));
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {} as { [key: string]: any });
};

const camelToSnake = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(v => camelToSnake(v));
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {} as { [key: string]: any });
};

interface DataContextType {
  members: Member[];
  transactions: Transaction[];
  events: Event[];
  documents: Document[];
  communications: Communication[];
  loading: boolean;
  error: string | null;
  
  // Ações de Fetching Específicas (Server-Side Filtering)
  fetchMembers: (search?: string, status?: string) => Promise<void>;
  fetchAllData: () => Promise<void>;

  // Ações de CRUD
  addMember: (data: Omit<Member, 'id'>) => Promise<void>;
  updateMember: (id: string, data: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  
  addTransaction: (data: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addEvent: (data: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, data: Omit<Event, 'id'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  
  addDocument: (data: Omit<Document, 'id' | 'url'>, file: File) => Promise<void>;
  deleteDocument: (doc: Document) => Promise<void>;
  
  addCommunication: (data: Omit<Communication, 'id'>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any, action: string) => {
    console.error(`Erro em ${action}:`, err);
    const message = err.message || `Erro desconhecido ao ${action}`;
    setError(message);
    // Limpa o erro após 5 segundos
    setTimeout(() => setError(null), 5000);
    throw err; // Propaga para o componente tratar UI específica se precisar
  };

  // Log de Auditoria Simples (No-op se a tabela não existir, apenas loga no console)
  const logAudit = async (action: string, tableName: string, recordId?: string, details?: string) => {
    if (!currentUser) return;
    console.log(`[AUDIT] User ${currentUser.email} performed ${action} on ${tableName} ID: ${recordId}`);
    // Aqui seria a implementação real: await supabase.from('audit_logs').insert(...)
  };

  const fetchMembers = useCallback(async (search = '', status = 'All') => {
    setLoading(true);
    try {
      let query = supabase.from('members').select('*').order('name', { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (status !== 'All') {
        query = query.eq('status', status);
      }

      // Limite padrão de segurança
      query = query.limit(100);

      const { data, error } = await query;
      if (error) throw error;
      setMembers(snakeToCamel(data) as Member[]);
    } catch (err) {
      handleError(err, 'buscar membros');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Parallel fetching
      const [transRes, eventsRes, docsRes, commsRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }).limit(200), // Limite inicial
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('documents').select('*').order('upload_date', { ascending: false }),
        supabase.from('communications').select('*').order('sent_at', { ascending: false })
      ]);

      if (transRes.error) throw transRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (docsRes.error) throw docsRes.error;
      if (commsRes.error) throw commsRes.error;

      setTransactions(snakeToCamel(transRes.data) as Transaction[]);
      setEvents(snakeToCamel(eventsRes.data) as Event[]);
      setDocuments(snakeToCamel(docsRes.data) as Document[]);
      setCommunications(snakeToCamel(commsRes.data) as Communication[]);
      
      // Fetch members initial batch
      await fetchMembers();

    } catch (err) {
      handleError(err, 'carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchMembers]);

  // --- CRUD Operations ---

  const addMember = async (data: Omit<Member, 'id'>) => {
    try {
      const { error } = await supabase.from('members').insert([camelToSnake(data)]);
      if (error) throw error;
      await logAudit('INSERT', 'members', undefined, `Added member ${data.email}`);
      await fetchMembers(); // Refresh
    } catch (err) { handleError(err, 'adicionar membro'); }
  };

  const updateMember = async (id: string, data: Partial<Member>) => {
    try {
      const { error } = await supabase.from('members').update(camelToSnake(data)).eq('id', id);
      if (error) throw error;
      await logAudit('UPDATE', 'members', id);
      await fetchMembers();
    } catch (err) { handleError(err, 'atualizar membro'); }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      await logAudit('DELETE', 'members', id);
      await fetchMembers();
    } catch (err) { handleError(err, 'excluir membro'); }
  };

  const addTransaction = async (data: Omit<Transaction, 'id'>) => {
    try {
      const { error } = await supabase.from('transactions').insert([camelToSnake(data)]);
      if (error) throw error;
      await logAudit('INSERT', 'transactions', undefined, `${data.type} - ${data.amount}`);
      
      // Refresh manual simples para transações (poderia ser otimizado)
      const { data: newData } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(200);
      setTransactions(snakeToCamel(newData) as Transaction[]);
    } catch (err) { handleError(err, 'adicionar transação'); }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      await logAudit('DELETE', 'transactions', id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) { handleError(err, 'excluir transação'); }
  };

  const addEvent = async (data: Omit<Event, 'id'>) => {
    try {
        const { error } = await supabase.from('events').insert([camelToSnake(data)]);
        if (error) throw error;
        const { data: newData } = await supabase.from('events').select('*').order('date', { ascending: false });
        setEvents(snakeToCamel(newData) as Event[]);
    } catch(err) { handleError(err, 'adicionar evento'); }
  };

  const updateEvent = async (id: string, data: Omit<Event, 'id'>) => {
      try {
          const { error } = await supabase.from('events').update(camelToSnake(data)).eq('id', id);
          if (error) throw error;
          const { data: newData } = await supabase.from('events').select('*').order('date', { ascending: false });
          setEvents(snakeToCamel(newData) as Event[]);
      } catch(err) { handleError(err, 'atualizar evento'); }
  };

  const deleteEvent = async (id: string) => {
      try {
          const { error } = await supabase.from('events').delete().eq('id', id);
          if(error) throw error;
          setEvents(prev => prev.filter(e => e.id !== id));
      } catch(err) { handleError(err, 'excluir evento'); }
  };

  const addDocument = async (docData: Omit<Document, 'id' | 'url'>, file: File) => {
    try {
        const filePath = `${currentUser!.id}/${new Date().getTime()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
        
        const dbRecord = { ...camelToSnake(docData), url: urlData.publicUrl };
        const { error: dbError } = await supabase.from('documents').insert([dbRecord]);
        if (dbError) throw dbError;

        const { data: newData } = await supabase.from('documents').select('*').order('upload_date', { ascending: false });
        setDocuments(snakeToCamel(newData) as Document[]);
    } catch(err) { handleError(err, 'adicionar documento'); }
  };

  const deleteDocument = async (doc: Document) => {
      try {
          try {
            const url = new URL(doc.url);
            const filePath = url.pathname.split('/documents/')[1];
            if (filePath) await supabase.storage.from('documents').remove([decodeURIComponent(filePath)]);
          } catch (e) { console.warn("Erro ao tentar deletar do storage, prosseguindo com DB", e)}

          const { error } = await supabase.from('documents').delete().eq('id', doc.id);
          if(error) throw error;
          setDocuments(prev => prev.filter(d => d.id !== doc.id));
      } catch(err) { handleError(err, 'excluir documento'); }
  };

  const addCommunication = async (data: Omit<Communication, 'id'>) => {
      try {
          const { error } = await supabase.from('communications').insert([camelToSnake(data)]);
          if(error) throw error;
          const { data: newData } = await supabase.from('communications').select('*').order('sent_at', { ascending: false });
          setCommunications(snakeToCamel(newData) as Communication[]);
      } catch(err) { handleError(err, 'salvar comunicação'); }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser, fetchAllData]);

  return (
    <DataContext.Provider value={{
      members, transactions, events, documents, communications, loading, error,
      fetchMembers, fetchAllData,
      addMember, updateMember, deleteMember,
      addTransaction, deleteTransaction,
      addEvent, updateEvent, deleteEvent,
      addDocument, deleteDocument,
      addCommunication
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};