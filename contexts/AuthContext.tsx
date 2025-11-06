import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, avatar_url')
      .eq('id', supabaseUser.id)
      .single();
    if (error) {
      console.error("Erro ao buscar perfil do usuário:", error.message);
      return null;
    }
    return {
      id: profile.id, email: profile.email, name: profile.name,
      role: profile.role, avatarUrl: profile.avatar_url,
    };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const userProfile = await fetchUserProfile(session?.user ?? null);
        setCurrentUser(userProfile);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);


  const fetchUsers = useCallback(async () => {
      if (currentUser?.role !== 'Super Admin') {
          setUsers([]); 
          return;
      }
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
          console.error("Error fetching users:", error);
      } else {
          setUsers(data.map(profile => ({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              avatarUrl: profile.avatar_url,
          })));
      }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
        fetchUsers();
    } else {
        setUsers([]);
    }
  }, [currentUser, fetchUsers]);

  const login = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error("Usuário ou senha inválidos.");
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => {
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) throw new Error("Sessão de administrador não encontrada.");
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
            data: {
                name: userData.name,
                role: userData.role,
                avatar_url: `https://i.pravatar.cc/150?u=${userData.email}`
            }
        }
    });

    // Restore the admin session
    await supabase.auth.setSession(adminSession);
    
    if (signUpError) throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
    if (!signUpData.user) throw new Error("Não foi possível criar o usuário.");
    
    await fetchUsers();
  }, [fetchUsers]);
  
  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
     const snakeCaseData = { name: data.name, role: data.role, email: data.email };
     Object.keys(snakeCaseData).forEach(key => (snakeCaseData as any)[key] === undefined && delete (snakeCaseData as any)[key]);

     const { error } = await supabase.from('profiles').update(snakeCaseData).eq('id', userId);
     if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
     
     await fetchUsers();
     
     if (currentUser && currentUser.id === userId) {
        // Force a re-fetch of the current user's profile
        const { data: { user } } = await supabase.auth.getUser();
        const updatedProfile = await fetchUserProfile(user);
        setCurrentUser(updatedProfile);
     }
  }, [currentUser, fetchUserProfile, fetchUsers]);
  
  const deleteUser = useCallback(async (userId: string) => {
    // This is insecure and should be done in a server-side environment.
    // For this internal tool, it's a placeholder.
    alert("A exclusão de usuários deve ser feita através de uma função de servidor segura (Supabase Edge Function) ou diretamente no painel do Supabase para evitar riscos de segurança.");
    console.warn(`Request to delete user ${userId} blocked on client-side.`);
  }, []);

  const value = { currentUser, loading, users, login, logout, addUser, updateUser, deleteUser };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};