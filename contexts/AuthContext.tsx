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
      if (error || !profile) {
        // This is not necessarily an error to throw, but a state where the profile doesn't exist yet.
        // The calling function will handle this.
        console.warn("User profile not found for uid:", supabaseUser.id);
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
  }, []);

  // Central listener for auth state changes
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userProfile = await fetchUserProfile(session?.user ?? null);
      setCurrentUser(userProfile);
      setLoading(false);
    }
    checkUser();

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

  // Fetch users only when the current user changes (and is an admin)
  useEffect(() => {
    if (currentUser && currentUser.role === 'Super Admin') {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [currentUser, fetchUsers]);

  const login = useCallback(async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error("Usuário ou senha inválidos.");
    if (!data.user) throw new Error("Login falhou, usuário não encontrado.");

    // After successful login, explicitly fetch the profile.
    // onAuthStateChange can be slow, this provides faster feedback.
    const userProfile = await fetchUserProfile(data.user);
    if (!userProfile) {
        // This is the critical part: if profile doesn't exist, sign out to prevent broken state.
        await supabase.auth.signOut();
        throw new Error("Perfil de usuário não encontrado. Contate o administrador.");
    }
    setCurrentUser(userProfile);
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error.message);
    setCurrentUser(null); // Immediately clear user for faster UI response
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'avatarUrl' | 'role'> & {password: string; role: UserRole}) => {
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) throw new Error("Sessão de administrador necessária para esta operação.");
    
    // We don't need to sign out. We can use the admin client to create a user,
    // but that's a server-side operation. Client-side, we sign up then restore session.
    // This flow is tricky. A better way is an Edge Function. But let's fix the client flow.
    
    // This is a Supabase client-side limitation. Sign-up logs the new user in.
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

    // CRITICAL: Restore admin session immediately after the signup call.
    const { error: sessionError } = await supabase.auth.setSession(adminSession);
    
    if (sessionError) {
        console.error("CRITICAL: Failed to restore admin session.", sessionError);
        await logout(); // Force logout for security
        throw new Error("Sua sessão expirou. Por favor, faça login novamente.");
    }

    if (signUpError) {
        throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
    }
    
    if (!signUpData.user) throw new Error("Não foi possível criar o usuário.");
    
    // Refresh user list
    await fetchUsers();
  }, [fetchUsers, logout]);
  
  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
     const snakeCaseData = { name: data.name, role: data.role, email: data.email };
     Object.keys(snakeCaseData).forEach(key => (snakeCaseData as any)[key] === undefined && delete (snakeCaseData as any)[key]);

     const { error } = await supabase.from('profiles').update(snakeCaseData).eq('id', userId);
     if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
     
     await fetchUsers();
     
     // If updating the current user, refresh their profile in the context
     if (currentUser && currentUser.id === userId) {
        const { data: { user } } = await supabase.auth.getUser();
        const updatedProfile = await fetchUserProfile(user);
        setCurrentUser(updatedProfile);
     }
  }, [currentUser, fetchUserProfile, fetchUsers]);
  
  const deleteUser = useCallback(async (userId: string) => {
    // This should be done via a Supabase Edge function for security.
    // Client-side user deletion is not recommended.
    alert("Funcionalidade em desenvolvimento. A exclusão de usuários deve ser feita no painel do Supabase.");
    console.warn(`Request to delete user ${userId} blocked. Implement a secure server-side function.`);
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