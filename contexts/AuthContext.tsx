import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../supabaseClient';
// FIX: In older versions of Supabase JS v2, the User type was exported as AuthUser.
// This change aligns with older v2 versions and resolves type errors.
import type { AuthUser as SupabaseUser, Session } from '@supabase/supabase-js';

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

      // If there's an error OR if no profile is found for an authenticated user,
      // it's treated as a potential RLS issue.
      if (error || !profile) {
          // Force a specific error code that we can reliably catch.
          throw { code: 'PGRST116', message: 'Profile not found or RLS issue' };
      }

      return {
        id: profile.id, email: profile.email, name: profile.name,
        role: profile.role, avatarUrl: profile.avatar_url,
      };
    } catch (error: any) {
        console.error("Error fetching user profile:", error.message);
        // This specific error code indicates a profile was not found, which we now also trigger manually.
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
    // FIX: Correctly handle the subscription object from onAuthStateChange for Supabase JS v2.
    // Older versions of Supabase JS v2 returned { data: subscription } instead of { data: { subscription } }.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session: Session | null) => {
        try {
          const userProfile = await fetchUserProfile(session?.user ?? null);
          setCurrentUser(userProfile);
        } catch (error) {
          console.error("Auth state change error:", error);
          // If profile fetch fails on session change, log out the user to ensure a clean state.
          setCurrentUser(null);
          await supabase.auth.signOut();
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
          // This path should ideally not be taken due to the new fetchUserProfile logic, but serves as a fallback.
          throw new Error("Perfil de usuário não encontrado após o login.");
        }
        // The onAuthStateChange will handle setting the user, but we can do it here for faster UI response.
        setCurrentUser(userProfile);
    } catch (error: any) {
        await supabase.auth.signOut();
        if (error.message === "RLS_RECURSION") {
             throw new Error(error.message); // Propagate the specific error for the UI to handle.
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
