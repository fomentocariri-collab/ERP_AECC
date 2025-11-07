import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
      if (error || !profile) {
        console.warn("User profile not found for uid:", supabaseUser.id, error);
        return null;
      }
      return {
        id: profile.id, email: profile.email, name: profile.name,
        role: profile.role, avatarUrl: profile.avatar_url,
      };
    } catch (error: any) {
        console.error("Error fetching user profile:", error.message);
        return null;
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
        console.error("Error fetching users (might be due to permissions):", error.message);
        setUsers([]);
    }
  }, [currentUser]);

  // Central listener for auth state changes
  useEffect(() => {
    setLoading(true);
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

  // Fetch users list when current user changes
  useEffect(() => {
      fetchUsers();
  }, [currentUser, fetchUsers]);

  const login = useCallback(async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error("Usuário ou senha inválidos.");
    if (!data.user) throw new Error("Login falhou, usuário não encontrado.");

    const userProfile = await fetchUserProfile(data.user);
    if (!userProfile) {
        await supabase.auth.signOut();
        throw new Error("Perfil de usuário não encontrado. Contate o administrador.");
    }
    // The onAuthStateChange listener will handle setting the user
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error.message);
    setCurrentUser(null);
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => {
    // 1. Get the current admin's session to restore it later
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) throw new Error("Sessão de administrador necessária para esta operação.");
    
    // 2. Sign up the new user. This temporarily signs out the admin.
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

    // 3. CRITICAL: Restore the admin session immediately.
    const { error: sessionError } = await supabase.auth.setSession(adminSession);
    
    if (sessionError) {
        console.error("CRITICAL: Failed to restore admin session.", sessionError);
        // If restoring fails, log out completely to force a clean state.
        await logout();
        throw new Error("Sua sessão expirou durante a criação do usuário. Por favor, faça login novamente.");
    }

    if (signUpError) {
        throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
    }
    
    if (!signUpData.user) throw new Error("Não foi possível criar o usuário.");
    
    // Refresh the user list
    await fetchUsers();
  }, [fetchUsers, logout]);
  
  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
     const snakeCaseData = { name: data.name, role: data.role, email: data.email };
     Object.keys(snakeCaseData).forEach(key => (snakeCaseData as any)[key] === undefined && delete (snakeCaseData as any)[key]);

     const { error } = await supabase.from('profiles').update(snakeCaseData).eq('id', userId);
     if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
     
     await fetchUsers();
     
     if (currentUser && currentUser.id === userId) {
        // FIX: Cast to unknown first to resolve the type mismatch between the local User type and SupabaseUser type.
        const updatedProfile = await fetchUserProfile(currentUser as unknown as SupabaseUser);
        setCurrentUser(updatedProfile);
     }
  }, [currentUser, fetchUserProfile, fetchUsers]);
  
  const deleteUser = useCallback(async (userId: string) => {
    // Note: Deleting a user from auth.users requires admin privileges and is best
    // handled via a Supabase Edge Function for security.
    alert("Funcionalidade em desenvolvimento. A exclusão de usuários deve ser feita no painel do Supabase.");
    console.warn(`Request to delete user ${userId} blocked. Implement a secure server-side function.`);
  }, []);

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