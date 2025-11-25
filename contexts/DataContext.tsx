import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Member, Transaction, Event, Document, Communication, Project, ServiceProvider, InventoryItem } from '../types';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

// Utilitários de conversão de case
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
  projects: Project[]; // Novo
  providers: ServiceProvider[]; // Novo
  inventory: InventoryItem[]; // Novo
  loading: boolean;
  error: string | null;
  
  fetchMembers: (search?: string, status?: string) => Promise<void>;
  fetchAllData: () => Promise<void>;

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
  
  sendCommunication: (data: Omit<Communication, 'id'>, recipients: string[]) => Promise<void>;

  // Novos CRUDs
  addProject: (data: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addProvider: (data: Omit<ServiceProvider, 'id'>) => Promise<void>;
  updateProvider: (id: string, data: Partial<ServiceProvider>) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;

  addInventoryItem: (data: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any, action: string) => {
    console.error(`Erro em ${action}:`, err);
    setError(err.message || `Erro ao ${action}`);
    setTimeout(() => setError(null), 5000);
  };

  const fetchMembers = useCallback(async (search = '', status = 'All') => {
    setLoading(true);
    try {
      let query = supabase.from('members').select('*').order('name', { ascending: true });
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      if (status !== 'All') query = query.eq('status', status);
      query = query.limit(100);
      const { data, error } = await query;
      if (error) throw error;
      setMembers(snakeToCamel(data) as Member[]);
    } catch (err) { handleError(err, 'buscar membros'); } finally { setLoading(false); }
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [transRes, eventsRes, docsRes, commsRes, projRes, provRes, invRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }).limit(200),
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('documents').select('*').order('upload_date', { ascending: false }),
        supabase.from('communications').select('*').order('sent_at', { ascending: false }),
        // Tentar buscar as novas tabelas (pode falhar se o SQL não tiver rodado)
        supabase.from('projects').select('*').order('start_date', { ascending: false }), 
        supabase.from('service_providers').select('*').order('name', { ascending: true }),
        supabase.from('inventory').select('*').order('name', { ascending: true }),
      ]);

      if (transRes.error) throw transRes.error;
      setTransactions(snakeToCamel(transRes.data) as Transaction[]);
      setEvents(snakeToCamel(eventsRes.data || []) as Event[]);
      setDocuments(snakeToCamel(docsRes.data || []) as Document[]);
      setCommunications(snakeToCamel(commsRes.data || []) as Communication[]);
      
      // Tratamento soft para tabelas que podem não existir ainda
      setProjects(snakeToCamel(projRes.data || []) as Project[]);
      setProviders(snakeToCamel(provRes.data || []) as ServiceProvider[]);
      setInventory(snakeToCamel(invRes.data || []) as InventoryItem[]);
      
      await fetchMembers();

    } catch (err) { handleError(err, 'carregar dados'); } finally { setLoading(false); }
  }, [currentUser, fetchMembers]);

  // Existing CRUDs
  const addMember = async (data: Omit<Member, 'id'>) => {
    try { const { error } = await supabase.from('members').insert([camelToSnake(data)]); if (error) throw error; await fetchMembers(); } catch (err) { handleError(err, 'adicionar membro'); }
  };
  const updateMember = async (id: string, data: Partial<Member>) => {
    try { const { error } = await supabase.from('members').update(camelToSnake(data)).eq('id', id); if (error) throw error; await fetchMembers(); } catch (err) { handleError(err, 'atualizar membro'); }
  };
  const deleteMember = async (id: string) => {
    try { const { error } = await supabase.from('members').delete().eq('id', id); if (error) throw error; await fetchMembers(); } catch (err) { handleError(err, 'excluir membro'); }
  };
  const addTransaction = async (data: Omit<Transaction, 'id'>) => {
    try { const { error } = await supabase.from('transactions').insert([camelToSnake(data)]); if (error) throw error; const { data: d } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(200); setTransactions(snakeToCamel(d)); } catch (err) { handleError(err, 'adicionar transação'); }
  };
  const deleteTransaction = async (id: string) => {
    try { const { error } = await supabase.from('transactions').delete().eq('id', id); if (error) throw error; setTransactions(prev => prev.filter(t => t.id !== id)); } catch (err) { handleError(err, 'excluir transação'); }
  };
  const addEvent = async (data: Omit<Event, 'id'>) => {
    try { const { error } = await supabase.from('events').insert([camelToSnake(data)]); if (error) throw error; const { data: d } = await supabase.from('events').select('*').order('date', { ascending: false }); setEvents(snakeToCamel(d)); } catch(err) { handleError(err, 'adicionar evento'); }
  };
  const updateEvent = async (id: string, data: Omit<Event, 'id'>) => {
      try { const { error } = await supabase.from('events').update(camelToSnake(data)).eq('id', id); if (error) throw error; const { data: d } = await supabase.from('events').select('*').order('date', { ascending: false }); setEvents(snakeToCamel(d)); } catch(err) { handleError(err, 'atualizar evento'); }
  };
  const deleteEvent = async (id: string) => {
      try { const { error } = await supabase.from('events').delete().eq('id', id); if(error) throw error; setEvents(prev => prev.filter(e => e.id !== id)); } catch(err) { handleError(err, 'excluir evento'); }
  };
  const addDocument = async (docData: Omit<Document, 'id' | 'url'>, file: File) => {
    try {
        const filePath = `${currentUser!.id}/${new Date().getTime()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
        const { error: dbError } = await supabase.from('documents').insert([{ ...camelToSnake(docData), url: urlData.publicUrl }]);
        if (dbError) throw dbError;
        const { data: d } = await supabase.from('documents').select('*').order('upload_date', { ascending: false });
        setDocuments(snakeToCamel(d));
    } catch(err) { handleError(err, 'adicionar documento'); }
  };
  const deleteDocument = async (doc: Document) => {
      try {
          const url = new URL(doc.url);
          const filePath = url.pathname.split('/documents/')[1];
          if (filePath) await supabase.storage.from('documents').remove([decodeURIComponent(filePath)]);
          const { error } = await supabase.from('documents').delete().eq('id', doc.id);
          if(error) throw error;
          setDocuments(prev => prev.filter(d => d.id !== doc.id));
      } catch(err) { handleError(err, 'excluir documento'); }
  };
  
  const sendCommunication = async (data: Omit<Communication, 'id'>, recipients: string[]) => {
      try {
          // Send email via Edge Function
          const { error: emailError } = await supabase.functions.invoke('send-email', {
              body: {
                  recipients,
                  subject: data.subject,
                  message: data.message
              }
          });

          if (emailError) throw new Error(`Erro ao enviar email: ${emailError.message}`);

          // Save to DB
          const { error } = await supabase.from('communications').insert([camelToSnake(data)]);
          if(error) throw error;
          
          const { data: d } = await supabase.from('communications').select('*').order('sent_at', { ascending: false });
          setCommunications(snakeToCamel(d));
      } catch(err) { 
          handleError(err, 'enviar comunicação'); 
          throw err;
      }
  };

  // --- NEW CRUDs ---

  const addProject = async (data: Omit<Project, 'id'>) => {
    try { const { error } = await supabase.from('projects').insert([camelToSnake(data)]); if (error) throw error; const { data: d } = await supabase.from('projects').select('*').order('start_date', { ascending: false }); setProjects(snakeToCamel(d)); } catch (err) { handleError(err, 'adicionar projeto'); }
  };
  const updateProject = async (id: string, data: Partial<Project>) => {
    try { const { error } = await supabase.from('projects').update(camelToSnake(data)).eq('id', id); if (error) throw error; const { data: d } = await supabase.from('projects').select('*').order('start_date', { ascending: false }); setProjects(snakeToCamel(d)); } catch (err) { handleError(err, 'atualizar projeto'); }
  };
  const deleteProject = async (id: string) => {
    try { const { error } = await supabase.from('projects').delete().eq('id', id); if (error) throw error; setProjects(prev => prev.filter(p => p.id !== id)); } catch (err) { handleError(err, 'excluir projeto'); }
  };

  const addProvider = async (data: Omit<ServiceProvider, 'id'>) => {
    try { const { error } = await supabase.from('service_providers').insert([camelToSnake(data)]); if (error) throw error; const { data: d } = await supabase.from('service_providers').select('*').order('name', { ascending: true }); setProviders(snakeToCamel(d)); } catch (err) { handleError(err, 'adicionar prestador'); }
  };
  const updateProvider = async (id: string, data: Partial<ServiceProvider>) => {
    try { const { error } = await supabase.from('service_providers').update(camelToSnake(data)).eq('id', id); if (error) throw error; const { data: d } = await supabase.from('service_providers').select('*').order('name', { ascending: true }); setProviders(snakeToCamel(d)); } catch (err) { handleError(err, 'atualizar prestador'); }
  };
  const deleteProvider = async (id: string) => {
    try { const { error } = await supabase.from('service_providers').delete().eq('id', id); if (error) throw error; setProviders(prev => prev.filter(p => p.id !== id)); } catch (err) { handleError(err, 'excluir prestador'); }
  };

  const addInventoryItem = async (data: Omit<InventoryItem, 'id'>) => {
    try { const { error } = await supabase.from('inventory').insert([camelToSnake(data)]); if (error) throw error; const { data: d } = await supabase.from('inventory').select('*').order('name', { ascending: true }); setInventory(snakeToCamel(d)); } catch (err) { handleError(err, 'adicionar patrimônio'); }
  };
  const updateInventoryItem = async (id: string, data: Partial<InventoryItem>) => {
    try { const { error } = await supabase.from('inventory').update(camelToSnake(data)).eq('id', id); if (error) throw error; const { data: d } = await supabase.from('inventory').select('*').order('name', { ascending: true }); setInventory(snakeToCamel(d)); } catch (err) { handleError(err, 'atualizar patrimônio'); }
  };
  const deleteInventoryItem = async (id: string) => {
    try { const { error } = await supabase.from('inventory').delete().eq('id', id); if (error) throw error; setInventory(prev => prev.filter(i => i.id !== id)); } catch (err) { handleError(err, 'excluir patrimônio'); }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser, fetchAllData]);

  return (
    <DataContext.Provider value={{
      members, transactions, events, documents, communications, 
      projects, providers, inventory,
      loading, error,
      fetchMembers, fetchAllData,
      addMember, updateMember, deleteMember,
      addTransaction, deleteTransaction,
      addEvent, updateEvent, deleteEvent,
      addDocument, deleteDocument,
      sendCommunication,
      addProject, updateProject, deleteProject,
      addProvider, updateProvider, deleteProvider,
      addInventoryItem, updateInventoryItem, deleteInventoryItem
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};