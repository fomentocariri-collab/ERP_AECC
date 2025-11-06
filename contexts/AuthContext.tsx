import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../supabaseClient';
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const setUserProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setCurrentUser(null);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, avatar_url')
      .eq('id', session.user.id)
      .single();
    
    // CRITICAL: If profile read fails, log out with a clear error.
    if (error || !profile) {
      console.error("Erro ao buscar perfil do usuário:", error?.message);
      
      // Prevent alert loop if there's no active user to begin with.
      if (currentUser) {
          alert("Falha ao buscar seu perfil de usuário. Isso geralmente é causado por uma política de segurança (RLS) na tabela 'profiles' que impede a leitura. Verifique as permissões no painel do Supabase. Você será desconectado.");
      }
      
      // Ensure logout happens
      // FIX: Corrected Supabase v2 API call for signing out.
      await supabase.auth.signOut();
      setCurrentUser(null);
      return;
    }
    
    // On success, set the user profile
    setCurrentUser({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatarUrl: profile.avatar_url,
    });
  }, [currentUser]); // Dependency added to avoid stale state in the closure

  useEffect(() => {
    // 1. Initial check on load
    const getInitialSession = async () => {
      // FIX: Corrected Supabase v2 API call to get the current session.
      const { data: { session } } = await supabase.auth.getSession();
      await setUserProfile(session);
      setLoading(false); // Stop loading ONLY after the initial check
    };

    getInitialSession();

    // 2. Listener for subsequent changes (login/logout in other tabs)
    // FIX: Corrected Supabase v2 API call to listen for auth state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // We don't want the listener to manage the initial loading state, but we need to react to changes
         if (session?.user?.id !== currentUser?.id) {
            await setUserProfile(session);
         }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [setUserProfile, currentUser]);


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

  const login = async (email: string, pass: string) => {
    // FIX: Corrected Supabase v2 API call for signing in with a password.
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const logout = useCallback(async () => {
    // FIX: Corrected Supabase v2 API call for signing out.
    const { error } = await supabase.auth.signOut();
    setCurrentUser(null); // Explicitly clear user state for immediate UI update
    if (error) {
        console.error('Error logging out:', error.message);
    }
  }, []);

  const addUser = async (userData: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => {
    // FIX: Corrected Supabase v2 API call to get the current session.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error("Sessão de administrador não encontrada. Por favor, faça login novamente.");
    }

    // FIX: Corrected Supabase v2 API call for signing up a new user.
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
    
    // Restore the admin session immediately after sign up
    // FIX: Corrected Supabase v2 API call to set the session.
    const { error: sessionError } = await supabase.auth.setSession(session);
    if (sessionError) {
        console.error("Error restoring admin session:", sessionError);
        alert("Erro crítico: A sessão do administrador não pôde ser restaurada. Por favor, atualize a página.");
        return;
    }

    if (signUpError) {
        console.error('Error creating user:', signUpError);
        alert(`Erro ao criar usuário: ${signUpError.message}`);
        return;
    }

    if (!signUpData.user) {
        alert("Não foi possível criar o usuário. Tente novamente.");
        return;
    }
    
    await fetchUsers();
    alert('Usuário adicionado com sucesso!');
  };
  
  const updateUser = async (userId: string, data: Partial<User>) => {
     const snakeCaseData = {
         name: data.name,
         role: data.role,
         email: data.email
     };

     Object.keys(snakeCaseData).forEach(key => (snakeCaseData as any)[key] === undefined && delete (snakeCaseData as any)[key]);

     const { error } = await supabase.from('profiles').update(snakeCaseData).eq('id', userId);

     if (error) {
        console.error('Error updating user profile:', error);
        alert(`Erro ao atualizar usuário: ${error.message}\n\nVerifique as permissões (RLS) para a tabela 'profiles'.`);
        return;
     }
     
     await fetchUsers();
     if (currentUser && currentUser.id === userId) {
        // FIX: Corrected Supabase v2 API call to get the current session.
        const { data: { session } } = await supabase.auth.getSession();
        await setUserProfile(session);
     }
  };
  
  const deleteUser = async (userId: string) => {
    alert("A exclusão de usuários deve ser feita através de uma função de servidor segura ou diretamente no painel do Supabase para evitar riscos de segurança.");
    console.warn(`Request to delete user ${userId} blocked on client-side.`);
  };


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