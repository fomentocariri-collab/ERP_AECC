import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../supabaseClient';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  users: User[];
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
    if (!supabaseUser) return null;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, avatar_url')
        .eq('id', supabaseUser.id)
        .single();

      // Se houver um erro OU se nenhum perfil for encontrado para um usuário autenticado,
      // é tratado como um problema potencial de RLS.
      if (error || !profile) {
          // Força um código de erro específico que podemos capturar de forma confiável.
          throw { code: 'PGRST116', message: 'Profile not found or RLS issue' };
      }

      return {
        id: profile.id, email: profile.email, name: profile.name,
        role: profile.role, avatarUrl: profile.avatar_url,
      };
    } catch (error: any) {
        console.error("Error fetching user profile:", error.message);
        // Este código de erro específico indica que um perfil não foi encontrado, que agora também disparamos manualmente.
        if (error.code === 'PGRST116') {
            throw new Error("RLS_RECURSION");
        }
        throw error;
    }
  }, []);
  
  const fetchUsers = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'Super Admin') {
        setUsers([]);
        return;
    };
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      setUsers(data.map(profile => ({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          avatarUrl: profile.avatar_url,
      })));
    } catch (error: any) {
        console.error("Error fetching users:", error.message);
        setUsers([]);
    }
  }, [currentUser]);

  useEffect(() => {
    setLoading(true);
    // FIX: Torna o tratamento da subscrição robusto para diferentes assinaturas da API.
    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session: Session | null) => {
        try {
          const userProfile = await fetchUserProfile(session?.user ?? null);
          setCurrentUser(userProfile);
        } catch (error) {
          console.error("Auth state change error:", error);
          // Se a busca de perfil falhar na mudança de sessão, desloga o usuário para garantir um estado limpo.
          setCurrentUser(null);
          await supabase.auth.signOut();
        } finally {
          setLoading(false);
        }
      }
    );

    // FIX: Correctly access the subscription object from the `data` property. The previous
    // logic could incorrectly reference the parent object, causing a runtime error.
    const subscription = data.subscription;
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  useEffect(() => {
      if(currentUser) {
        fetchUsers();
      }
  }, [currentUser, fetchUsers]);

  const login = useCallback(async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error("Usuário ou senha inválidos.");
    if (!data.user) throw new Error("Login falhou, usuário não encontrado.");

    try {
        const userProfile = await fetchUserProfile(data.user);
        if (!userProfile) {
          // Este caminho idealmente não deve ser tomado devido à nova lógica de fetchUserProfile, mas serve como um fallback.
          throw new Error("Perfil de usuário não encontrado após o login.");
        }
        // O onAuthStateChange cuidará de definir o usuário, mas podemos fazer isso aqui para uma resposta de UI mais rápida.
        setCurrentUser(userProfile);
    } catch (error: any) {
        await supabase.auth.signOut();
        if (error.message === "RLS_RECURSION") {
             throw new Error(error.message); // Propaga o erro específico para a UI lidar.
        }
        throw new Error(`Login OK, mas perfil não encontrado. Verifique a RLS (Row Level Security) da tabela 'profiles'.`);
    }
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUsers([]);
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => {
    const { error } = await supabase.functions.invoke('create-user', {
        body: {
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role,
        },
    });

    if (error) {
        throw new Error(`Erro ao criar usuário: ${error.message}`);
    }

    await fetchUsers();
  }, [fetchUsers]);
  
  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
     const snakeCaseData = { name: data.name, role: data.role, email: data.email };
     Object.keys(snakeCaseData).forEach(key => (snakeCaseData as any)[key] === undefined && delete (snakeCaseData as any)[key]);

     const { error } = await supabase.from('profiles').update(snakeCaseData).eq('id', userId);
     if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
     
     if (currentUser && currentUser.id === userId) {
        const { data: { session } } = await supabase.auth.getSession();
        const updatedProfile = await fetchUserProfile(session?.user ?? null);
        setCurrentUser(updatedProfile);
     }
     await fetchUsers();

  }, [currentUser, fetchUserProfile, fetchUsers]);
  
  const deleteUser = useCallback(async (userId: string) => {
    const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
    });

    if (error) {
        throw new Error(`Erro ao excluir usuário: ${error.message}`);
    }

    await fetchUsers();
  }, [fetchUsers]);

  const value = useMemo(() => ({ currentUser, loading, users, login, logout, addUser, updateUser, deleteUser }),
    [currentUser, loading, users, login, logout, addUser, updateUser, deleteUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
