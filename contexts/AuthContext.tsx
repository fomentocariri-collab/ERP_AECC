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
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, avatar_url')
        .eq('id', supabaseUser.id)
        .single();
      if (error) throw error;
      return {
        id: profile.id, email: profile.email, name: profile.name,
        role: profile.role, avatarUrl: profile.avatar_url,
      };
    } catch (error: any) {
        console.error("Erro ao buscar perfil do usuário:", error.message);
        return null;
    }
  }, []);
  
  const fetchUsers = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'Super Admin') {
      setUsers([]);
      return;
    }
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
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [currentUser, fetchUsers]);


  useEffect(() => {
    setLoading(true);
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userProfile = await fetchUserProfile(session?.user ?? null);
      setCurrentUser(userProfile);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const userProfile = await fetchUserProfile(session?.user ?? null);
        setCurrentUser(userProfile);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);


  const login = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error("Usuário ou senha inválidos.");
    // onAuthStateChange will handle setting the user
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error.message);
    // onAuthStateChange will clear the user
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => {
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) throw new Error("Sessão de administrador necessária para esta operação.");
    
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

    if (signUpError) {
        // If signUp fails, the session is likely unchanged, but check just in case.
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
             await supabase.auth.setSession(adminSession);
        }
        throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
    }
    
    // Immediately restore the admin session. onAuthStateChange might fire with the new user,
    // but this will correct it back to the admin.
    const { error: sessionError } = await supabase.auth.setSession(adminSession);
    if(sessionError) {
        console.error("CRITICAL: Failed to restore admin session.", sessionError);
        await logout(); // Force logout for security
        throw new Error("Sua sessão expirou. Por favor, faça login novamente.");
    }
    
    if (!signUpData.user) throw new Error("Não foi possível criar o usuário.");
    
    await fetchUsers();
  }, [fetchUsers, logout]);
  
  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
     const snakeCaseData = { name: data.name, role: data.role, email: data.email };
     Object.keys(snakeCaseData).forEach(key => (snakeCaseData as any)[key] === undefined && delete (snakeCaseData as any)[key]);

     const { error } = await supabase.from('profiles').update(snakeCaseData).eq('id', userId);
     if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
     
     await fetchUsers();
     
     if (currentUser && currentUser.id === userId) {
        const { data: { user } } = await supabase.auth.getUser();
        const updatedProfile = await fetchUserProfile(user);
        setCurrentUser(updatedProfile);
     }
  }, [currentUser, fetchUserProfile, fetchUsers]);
  
  const deleteUser = useCallback(async (userId: string) => {
    alert("Funcionalidade em desenvolvimento. A exclusão de usuários deve ser feita no painel do Supabase.");
    console.warn(`Request to delete user ${userId} blocked. Implement a secure server-side function.`);
  }, []);

  const value = { currentUser, loading, users, login, logout, addUser, updateUser, deleteUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};