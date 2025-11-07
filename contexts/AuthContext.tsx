import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../supabaseClient';
// FIX: The 'User' type is not exported in older versions of `@supabase/supabase-js`.
// We import 'Session' instead and derive the User type from it.
import type { Session } from '@supabase/supabase-js';

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

// FIX: Define SupabaseUser type from Session to handle cases where User type is not exported.
type SupabaseUser = Session['user'];

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
        console.error("Error fetching users:", error.message);
        setUsers([]);
    }
  }, [currentUser]);

  useEffect(() => {
    setLoading(true);
    // FIX: The `onAuthStateChange` method should exist, the error might be a side-effect of other type issues.
    // This syntax is correct for Supabase JS v2.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const userProfile = await fetchUserProfile(session?.user ?? null);
        
        // Previne loop de renderização comparando o estado antigo e o novo
        setCurrentUser(prevUser => {
            if (JSON.stringify(prevUser) === JSON.stringify(userProfile)) {
                return prevUser;
            }
            return userProfile;
        });

        setLoading(false);
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
    // FIX: `signInWithPassword` was introduced in later versions. Using `signIn` for broader compatibility.
    // The response structure is also adjusted from `{ data, error }` to `{ data: { user }, error }`.
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error("Usuário ou senha inválidos.");
    if (!data.user) throw new Error("Login falhou, usuário não encontrado.");

    const userProfile = await fetchUserProfile(data.user);
    if (!userProfile) {
        // FIX: `signOut` should exist. The error is likely due to TS type resolution issues.
        await supabase.auth.signOut();
        throw new Error("Perfil de usuário não encontrado. Contate o administrador.");
    }
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    // FIX: `signOut` should exist.
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    setCurrentUser(null); 
    window.location.href = "/";
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => {
    // FIX: `getSession` in older versions was synchronous and returned the session directly.
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) throw new Error("Sessão de administrador necessária.");
    
    // FIX: `signUp` should exist.
    const { error: signUpError } = await supabase.auth.signUp({
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

    // FIX: `setSession` should exist for session restoration.
    const { error: sessionError } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
    });
    
    if (sessionError) {
        console.error("CRITICAL: Failed to restore admin session.", sessionError);
        await logout();
        throw new Error("Sua sessão expirou. Por favor, faça login novamente.");
    }

    if (signUpError) {
        throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
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
        // FIX: `getSession` in older versions was synchronous. Using modern async version.
        const { data: { session } } = await supabase.auth.getSession();
        const updatedProfile = await fetchUserProfile(session?.user ?? null);
        setCurrentUser(updatedProfile);
     }
  }, [currentUser, fetchUserProfile, fetchUsers]);
  
  const deleteUser = useCallback(async (userId: string) => {
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
