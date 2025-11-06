import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
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
    if (!supabaseUser) {
      return null;
    }

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
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatarUrl: profile.avatar_url,
    };
  }, []);

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
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error("Usuário ou senha inválidos.");
  };

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    }
    // setCurrentUser is handled by onAuthStateChange
  }, []);

  const addUser = async (userData: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => {
    // Save the current admin session to restore it later
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) {
        throw new Error("Sessão de administrador não encontrada. Por favor, faça login novamente.");
    }
    
    // Sign up the new user
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

    // IMPORTANT: Restore the admin session immediately
    const { error: sessionError } = await supabase.auth.setSession(adminSession);
    if (sessionError) {
        console.error("Error restoring admin session:", sessionError);
        alert("Erro crítico: A sessão do administrador não pôde ser restaurada. Por favor, atualize a página.");
        logout(); // Force a full re-auth if session is lost
        return;
    }
    
    if (signUpError) {
        throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
    }

    if (!signUpData.user) {
        throw new Error("Não foi possível criar o usuário. Tente novamente.");
    }
    
    // Refresh the users list
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
        throw new Error(`Erro ao atualizar usuário: ${error.message}\n\nVerifique as permissões (RLS) para a tabela 'profiles'.`);
     }
     
     await fetchUsers();
     // If the updated user is the current user, update their context state
     if (currentUser && currentUser.id === userId) {
        const updatedProfile = await fetchUserProfile(supabase.auth.getUser() as unknown as SupabaseUser);
        setCurrentUser(updatedProfile);
     }
  };
  
  const deleteUser = async (userId: string) => {
    alert("A exclusão de usuários deve ser feita através de uma função de servidor segura (Supabase Edge Function) ou diretamente no painel do Supabase para evitar riscos de segurança.");
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