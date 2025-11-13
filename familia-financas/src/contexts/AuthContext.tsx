// Auth Context Provider
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string, setLoadingState: boolean = true) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      console.log('Perfil carregado:', data);

      // Se não existir perfil, criar um padrão
      if (!data) {
        console.log('Nenhum perfil encontrado. Criando perfil padrão...');
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            persona_type: 'iniciante_perdido',  // Valores válidos: 'iniciante_perdido', 'frustrado_anonimo', 'sem_tempo', 'gastador_impulsivo'
            primary_goal: 'controlar_gastos',   // Valores válidos: 'fazer_sobrar', 'quitar_divida', 'criar_reserva', 'controlar_gastos'
            onboarding_completed: false
          })
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar perfil padrão:', createError);
          throw createError;
        }

        console.log('Perfil padrão criado:', newProfile);
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Não fazer throw para não quebrar a autenticação
    } finally {
      if (setLoadingState) {
        setLoading(false);
      }
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user) throw new Error('No user logged in');

    // Verificar autenticação atual
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Usuário não autenticado');

    console.log('Atualizando perfil com:', updates);

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: currentUser.id,
          ...updates,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
    
    console.log('Perfil atualizado com sucesso:', data);
    
    // Reload profile without changing loading state
    await loadProfile(currentUser.id, false);
    
    console.log('Perfil recarregado');
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}