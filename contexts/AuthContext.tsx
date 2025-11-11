import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
// Fix: Corrected the import path for the supabase client.
import { supabase } from '../supabaseClient';
import type { AuthChangeEvent, User as SupabaseUser, Session } from '@supabase/supabase-js';

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
      if (!profile) return null;

      return {
        id: profile.id, email: profile.email, name: profile.name,
        role: profile.role, avatarUrl: profile.avatar_url,
      };
    } catch (error: any) {
        console.error("Error fetching user profile:", error.message);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!session) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        try {
            const userProfile = await fetchUserProfile(session.user);
            // Only update state if the profile has actually changed to avoid re-renders
            setCurrentUser(prevUser => 
                JSON.stringify(prevUser) !== JSON.stringify(userProfile) ? userProfile : prevUser
            );
        } catch(e) {
            console.error("Failed to fetch user profile on auth change, but session is valid. User will not be logged out.", e);
            // DO NOT sign out here. A temporary network error shouldn't kill the session.
            // If the token is truly invalid, subsequent API calls will fail and the user will be prompted to log in again.
        } finally {
            setLoading(false);
        }
      }
    );
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
          throw new Error("Login OK, mas perfil não encontrado.");
        }
    } catch (error: any) {
        await supabase.auth.signOut();
        if (error.message && error.message.includes('infinite recursion')) {
             throw new Error("RLS_RECURSION");
        }
        throw new Error(`Login OK, mas perfil não encontrado. Verifique a RLS (Row Level Security) da tabela 'profiles' no Supabase.`);
    }
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    setCurrentUser(null); 
    window.location.href = "/";
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => {
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) throw new Error("Sessão de administrador necessária.");
    
    // Sign up the new user
    const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
    });
    
    // If sign up failed, restore admin session and throw error
    if (signUpError) {
        await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });
        throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
    }

    if (!newUser) {
        await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });
        throw new Error("Não foi possível criar o novo usuário.");
    }

    // Update the new user's profile with additional data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: userData.name,
        role: userData.role,
        avatar_url: `https://i.pravatar.cc/150?u=${userData.email}`
      })
      .eq('id', newUser.id);
      
    // Restore the admin session regardless of profile update outcome
    const { error: sessionError } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
    });
    
    if (sessionError) {
        console.error("CRITICAL: Failed to restore admin session.", sessionError);
        await logout();
        throw new Error("Sua sessão expirou. Por favor, faça login novamente.");
    }

    if (profileError) {
        // Here you might want to clean up the created user if the profile update fails
        console.error("User created but profile update failed:", profileError);
        throw new Error(`Usuário criado, mas falha ao salvar perfil: ${profileError.message}`);
    }
    
    await fetchUsers();
  }, [fetchUsers, logout]);
  
  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
     const snakeCaseData = { name: data.name, role: data.role, email: data.email };
     Object.keys(snakeCaseData).forEach(key => (snakeCaseData as any)[key] === undefined && delete (snakeCaseData as any)[key]);

     const { error } = await supabase.from('profiles').update(snakeCaseData).eq('id', userId);
     if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
     
     await fetchUsers();
     
     if (currentUser && currentUser.id === userId) {
        const { data: { session } } = await supabase.auth.getSession();
        const updatedProfile = await fetchUserProfile(session?.user ?? null);
        setCurrentUser(updatedProfile);
     }
  }, [currentUser, fetchUserProfile, fetchUsers]);
  
  const deleteUser = useCallback(async (userId: string) => {
    alert("Funcionalidade em desenvolvimento. A exclusão de usuários deve ser feita no painel do Supabase.");
    console.warn(`Request to delete user ${userId} blocked. Implement a secure server-side function.`);
    // For security reasons, user deletion should be handled by a server-side function (e.g., a Supabase Edge Function)
    // that verifies the caller's permissions before proceeding.
    // const { error } = await supabase.functions.invoke('delete-user', { body: { userId } });
    // if(error) throw new Error(error.message);
    // await fetchUsers();
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